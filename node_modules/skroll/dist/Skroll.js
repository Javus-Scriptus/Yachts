(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Skroll = factory());
}(this, (function () { 'use strict';

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (prefix) {
        return this.slice(0, prefix.length) === prefix;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/**
 * throttle节流函数
 * @refer https://stackoverflow.com/a/27078401
 */
var raf = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    function (callback) { window.setTimeout(callback, 0); };

// Only used for the dirty checking, so the event callback count is limited to max 1 call per fps per sensor.
// In combination with the event based resize sensor this saves cpu time, because the sensor is too fast and
// would generate too many unnecessary events.

var _list = null;

var _preBlank;
var _subBlank;

var _conf = {
    hideAsInit: true,
    mode: 1, // 1: active, to get element pos in time; 0: passive, to keep element pos and wait for changes to come.
    itemHeightFixed: false, // if each item is of the same height and won't change.
    _itemHeight: 0,
    _liveRangeOffset: 0,
    get liveRangeOffset() {
        if (this._liveRangeOffset !== 0) return this._liveRangeOffset;
        this._liveRangeOffset = Math.ceil(this.screenMaxHeight / _cache.minHeight) * this.liveRatio;
        return this._liveRangeOffset;
    },
    set liveRangeOffset(ro) {
        this._liveRangeOffset = ro;
    },
    _liveRange: 0,
    get liveRange() {
        if (this._liveRange !== 0) return this._liveRange;
        this._liveRange = Math.ceil(this.screenMaxHeight / _cache.minHeight) * (1 + this.liveRatio);
        return this._liveRange;
    },
    set liveRange(r) {
        this._liveRange = r;
    },
    liveRatio: 1,
    displayNeeded: false,
    ifRequestAnimationFrame: true,
    screenMaxHeight: window.screen.height,
    usePaddingOrBlank: 1 // 0: padding, 1: blank
};

var _cache = {
    touchStartLock: false,
    touchEndLock: false,
    showBegin: 0,
    showEnd: 0,
    listLen: 0,
    begin: 0, // 刚好没过(<=)pos的元素索引，从1到len-2
    pos: 0,
    dir: 0, // 0: down, 1: up
    hIndex: [], // height
    hIndexOf: function (i, children, cache) {
        if (_conf.itemHeightFixed) {
            if (_conf._itemHeight === 0) {
                _conf._itemHeight = children[i].offsetHeight;
            }
            this.hIndex[i] = _conf._itemHeight;
            return _conf._itemHeight;
        }
        if (cache === true) return this.hIndex[i];
        if (_conf.mode === 0) return this.hIndex[i];
        if (i < this.pSafeTo) return this.hIndex[i];
        if (this.vIndex[i] === false) return this.hIndex[i];
        var r = children[i].offsetHeight;
        this.hIndex[i] = r;
        return r;
    },
    pIndex: [], // position
    pIndexOf: function (i, len, children, dir, cache) { //TODO: RECONSIDER
        if (_conf.itemHeightFixed) {
            var confItemHeight = _conf._itemHeight;
            if (confItemHeight === 0) {
                confItemHeight = _conf._itemHeight = children[i].offsetHeight;
            }
            confItemHeight *= (i - 1);
            this.pIndex[i] = confItemHeight;
            return confItemHeight;
        }
        if (cache === true) return this.pIndex[i];
        if (_conf.mode === 0) return this.pIndex[i];
        if (i === 0) return 0;
        var r;
        if (i <= this.pSafeTo) {
            r = this.pIndex[i];
        } else {
            if (dir === 0) { // i++, go down
                r = this.pIndexOf(i - 1, len, children, dir) + this.hIndexOf(i - 1, children);
                this.pSafeTo = i;
            } else if (dir === 1) { // i--, go up
                if (i === len) {
                    r = _list.offsetHeight;
                } else {
                    r = this.pIndexOf(i + 1, len, children, dir) - this.hIndexOf(i, children);
                }
                if (this.pIndex[i] === r) {
                    this.pSafeTo = i;
                }
            } else if (dir === -1) { // get by offsetTop
                r = children[i].offsetTop;
                if (this.pIndex[i] === r) {
                    this.pSafeTo = i;
                }
            } else {
                return this.pIndex[i];
            }
            this.pIndex[i] = r;
        }
        return r;
    },
    pUnsafeAll: function () { // 使用过hIndexOf、pIndexOf后，需要及时将pSafeTo重置
        this.pSafeTo = 0;
    },
    pSafeTo: 0,
    vIndex: [], // visible
    dIndex: [], // display
    rIndex: [], // removal
    preHeight: 0,
    updatePreHeight: function () {
        if (_conf.usePaddingOrBlank === 0) {
            _list.style.paddingTop = _cache.preHeight + 'px';
        } else {
            _preBlank.style.height = _cache.preHeight + 'px';
        }
    },
    subHeight: 0,
    updateSubHeight: function () {
        if (_conf.usePaddingOrBlank === 0) {
            _list.style.paddingBottom = _cache.subHeight + 'px';
        } else {
            _subBlank.style.height = _cache.subHeight + 'px';
        }
    },
    minHeight: 1000000 // minimum height of a child node
};

var childNodes = function () {
    if (_conf.usePaddingOrBlank === 0) return _list.children;
    var r = _list.children;
    return Array.prototype.slice.call(r, 1, r.length - 1);
};

var _getStyle = function (oElm, strCssRule) {
    var strValue = '';
    if (document.defaultView && document.defaultView.getComputedStyle) {
        strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
    } else if (oElm.currentStyle) {
        strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
            return p1.toUpperCase();
        });
        strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
};

var _initBlank = function () {
    _cache.preHeight = 0;
    _cache.subHeight = 0;
    if (_conf.usePaddingOrBlank === 1) {
        var blankStyle = 'width:0;height:0;padding:0;border:0;margin:0;';
        _preBlank = document.createElement('div');
        _preBlank.setAttribute('style', blankStyle);
        _list.insertBefore(_preBlank, _list.children[0]);
        _subBlank = document.createElement('div');
        _subBlank.setAttribute('style', blankStyle);
        _list.appendChild(_subBlank);
        _list.appendChild = function (el) {
            _list.insertBefore(el, _subBlank);
        };
    }
};

var _initIndex = function (len, children) {
    var h = 0;
    var curH, minH = 1000000, min = 12;
    for (var i = 0; i < len; i++) {
        children[i].setAttribute('data-key', i);
        // if(_conf.mode === 0) {
        curH = _conf.itemHeightFixed ? _cache.hIndexOf(i, children) : children[i].offsetHeight;//_cache.hIndexOf(i, children);
        if (curH < minH && curH > min) {
            minH = curH;
        }
        _cache.pIndex[i] = h;
        _cache.hIndex[i] = curH;
        h += curH;
        // }

        _cache.vIndex[i] = true;
        if (_conf.displayNeeded) _cache.dIndex[i] = _getStyle(children[i], 'display');
    }
    _cache.showBegin = 0;
    _cache.showEnd = len - 1;
    _cache.minHeight = (minH === 1000000 ? min : minH);
};

var init = function (list, conf) {
    _conf.itemHeightFixed = conf.itemHeightFixed || _conf.itemHeightFixed;
    _conf.usePaddingOrBlank = (conf.filler === 2 ? 1 : 0);
    var children = list.children;
    if (!children || !children.length) {
        return;
    }

    _list = list;

    var len = children.length;

    _initIndex(len, children);

    _initBlank();

    if (_conf.usePaddingOrBlank === 1) children = childNodes();

    if (_conf.hideAsInit) { // 隐藏首尾
        var tempBegin = 0 - _conf.liveRangeOffset,
            tempEnd = 0 + _conf.liveRange - 1;
        if (tempBegin < 0) tempBegin = 0;
        if (tempEnd >= len) tempEnd = len - 1;
        var i;
        for (i = tempBegin - 1; i >= 0; i--) {
            _cache.preHeight += _cache.hIndexOf(i, children);
            children[i].style.display = 'none';
            _cache.vIndex[i] = false;
        }
        _cache.updatePreHeight();

        for (i = tempEnd + 1; i < len; i++) {
            _cache.subHeight += _cache.hIndexOf(i, children);
            children[i].style.display = 'none';
            _cache.vIndex[i] = false;
        }
        _cache.updateSubHeight();

        _cache.showBegin = tempBegin;
        _cache.showEnd = tempEnd;
    }

    _cache.listLen = len;
};

var _getBeginOfScrollEnd = function (pos, len, children) {
    var begin = -1, i;

    _cache.pIndexOf(_cache.begin, len, children, -1);

    if (_cache.dir === 0) { // 向下移动
        var pi;
        for (i = _cache.begin; i >= 0; i--) {
            if (_cache.rIndex[i] === true) continue;
            pi = _cache.pIndexOf(i, len, children, 1);
            if (pi <= pos) { // 第i个元素刚好没过pos
                begin = i;
                break;
            }
        }
        if (begin < 0) begin = 0;
    } else { // 向上移动
        var pi;
        for (i = _cache.begin; i < len; i++) {
            if (_cache.rIndex[i] === true) continue;
            pi = _cache.pIndexOf(i, len, children, 0);
            _cache.pSafeTo = i;
            if (pi > pos) { // 第i个元素刚好超过pos
                begin = i - 1;
                break;
            }
        }
        if (begin < 0) begin = len - 1;
    }
    return begin;
};

var _getBeginClosed = function () {
    var children = childNodes();
    var len = children.length;
    var pos = _cache.pos;
    var begin = _cache.begin, i;
    var i;
    var r = -1;
    if (_cache.pIndexOf(begin, len, children) > pos) { // 第begin个元素过pos
        r = 0;
        for (i = begin - 1; i >= 0; i--) {
            if (_cache.rIndex[i] === true) continue;
            if (_cache.pIndexOf(i, len, children, 1) <= pos) { // 第i个元素刚好没过pos
                r = i;
                break;
            }
        }
    } else {
        r = len - 1;
        for (i = begin + 1; i < len; i++) {
            if (_cache.rIndex[i] === true) continue;
            if (_cache.pIndexOf(i, len, children, 0) > pos) { // 第i个元素刚好过pos
                r = i - 1;
                break;
            }
            _cache.pSafeTo = i;
        }
    }
    return r;
};

var updateByForce = function (notAll, onlyDown) {
    var children = childNodes();
    var len = children.length;
    var begin = _getBeginClosed();
    if (onlyDown === true) rshow(begin, begin - _conf.liveRangeOffset, len, children, true, !notAll);
    show(begin, begin + _conf.liveRange - 1, len, children, true, !notAll);
    _cache.begin = begin;
    _cache.pUnsafeAll();
};

var updateOnElementAdd = function (olen, nlen) {
    var children = childNodes();
    if (!olen) {
        olen = _cache.listLen;
    }
    if (!nlen) {
        nlen = children.length;
    }

    var ifShow = _cache.vIndex[olen - 1];
    if (olen < nlen) {
        _cache.listLen = nlen;
        var h = _cache.pIndexOf(olen - 1, olen, children, 0) + _cache.hIndexOf(olen - 1, children);
        _cache.pSafeTo = olen - 1;
        var curH;
        for (var i = olen; i < nlen; i++) {
            if (_cache.rIndex[i] === true) continue;
            children[i].setAttribute('data-key', i);
            curH = _conf.itemHeightFixed ? _cache.hIndexOf(i, children) : children[i].offsetHeight;//_cache.hIndexOf(i, children);
            // if(_conf.mode === 0) {
            _cache.pIndex[i] = h;
            _cache.hIndex[i] = curH;
            // }
            h += curH;
            _cache.vIndex[i] = ifShow;
            if (_conf.displayNeeded) _cache.dIndex[i] = _getStyle(children[i], 'display');
            if (!ifShow) {
                children[i].style.display = 'none';
                _cache.subHeight += curH;
            }
        }
        _cache.pUnsafeAll();
        if (!ifShow) _cache.updateSubHeight();
    }
};

var _checkListLen = function (olen, nlen) {
    if (olen !== nlen) updateOnElementAdd(olen, nlen);
};

var updateOnTouchEnd = function (pos) {
    if (_cache.touchStartLock) {
        window.setTimeout(function () {
            updateOnTouchEnd(pos);
        }, 100);
        return;
    }

    _cache.touchEndLock = true;

    var children = childNodes();
    var len = children.length;

    _checkListLen(_cache.listLen, len);

    var begin = 0;
    if (pos < 0) pos = -pos;
    if (pos === _cache.pos) {
        _cache.touchEndLock = false;
        return;
    }
    if (pos < _cache.pos) {
        _cache.dir = 0; // 向下移动
    } else {
        _cache.dir = 1; // 向上移动
    }
    _cache.pos = pos;

    begin = _getBeginOfScrollEnd(pos, len, children);

    var to;
    if (_cache.dir === 0) { // 向下移动
        to = begin - _conf.liveRangeOffset;
        rshow(_cache.begin, to, len, children, true); //TODO: 一直单方向移动会造成显示的元素过多
        // show();
    } else { // 向上移动
        to = begin + _conf.liveRange - 1;
        show(_cache.begin, to, len, children, true);
        // rshow();
    }

    _cache.begin = begin;

    _cache.touchEndLock = false;

    _cache.pUnsafeAll();
};

var show = function (begin, end, len, children, ifCheck, forceUpdate) { // go down
    if (begin < 0) begin = 0;
    if (end > len - 1) end = len - 1;

    var displayNeeded = _conf.displayNeeded;
    for (var j = begin; j <= end; j++) {
        if (_cache.rIndex[j] === true) continue;
        if (_cache.vIndex[j]) continue;
        _cache.vIndex[j] = true;
        if (!_conf.ifRequestAnimationFrame) {
            children[j].style.display = displayNeeded ? _cache.dIndex[j] : 'block';
        } else {
            raf((function (j) {
                return function () {
                    children[j].style.display = displayNeeded ? _cache.dIndex[j] : 'block';
                };
            })(j));
        }
        _cache.subHeight -= _cache.hIndexOf(j, children);
    }

    _cache.showEnd = end;

    if (ifCheck) {
        for (var j = end + 1; j < len; j++) {
            if (_cache.rIndex[j] === true) continue;
            if (!_cache.vIndex[j]) {
                if (forceUpdate) continue;
                break;
            }
            var hj = _cache.hIndexOf(j, children);
            if (!_conf.ifRequestAnimationFrame) {
                children[j].style.display = 'none';
            } else {
                raf((function (j) {
                    return function () {
                        children[j].style.display = 'none';
                    };
                })(j));
            }
            _cache.vIndex[j] = false;
            _cache.subHeight += hj;
        }
    }

    if (_cache.subHeight < 0) _cache.subHeight = 0;
    _cache.updateSubHeight();
};

var rshow = function (begin, end, len, children, ifCheck, forceUpdate) { // go up
    if (end < 0) end = 0;
    if (begin > len - 1) begin = len - 1;

    var displayNeeded = _conf.displayNeeded;
    for (var j = begin; j >= end; j--) {
        if (_cache.rIndex[j] === true) continue;
        if (_cache.vIndex[j]) continue;
        _cache.vIndex[j] = true;
        if (!_conf.ifRequestAnimationFrame) {
            children[j].style.display = displayNeeded ? _cache.dIndex[j] : 'block';
        } else {
            raf((function (j) {
                return function () {
                    children[j].style.display = displayNeeded ? _cache.dIndex[j] : 'block';
                };
            })(j));
        }
        _cache.preHeight -= _cache.hIndexOf(j, children);
    }

    _cache.showBegin = end;

    if (ifCheck) {
        for (var j = end - 1; j >= 0; j--) {
            if (_cache.rIndex[j] === true) continue;
            if (!_cache.vIndex[j]) {
                if (forceUpdate) continue;
                break;
            }
            var hj = _cache.hIndexOf(j, children);
            if (!_conf.ifRequestAnimationFrame) {
                children[j].style.display = 'none';
            } else {
                raf((function (j) {
                    return function () {
                        children[j].style.display = 'none';
                    };
                })(j));
            }
            _cache.vIndex[j] = false;
            _cache.preHeight += hj;
        }
    }

    if (_cache.preHeight < 0) _cache.preHeight = 0;
    _cache.updatePreHeight();
};

var getTouchedElement = function (touchY, offset) {
    var begin = _getBeginClosed();
    var len = _cache.listLen;
    // _cache.pUnsafeAll();
    var bh = _cache.pIndexOf(begin, len, childNodes());
    var r = 0;
    offset += touchY;
    if (bh < offset) {
        var i;
        for (i = begin + 1; i < len; i++) {
            if (_cache.pIndexOf(i, len, childNodes(), 0) > offset) {
                r = i - 1;
                break;
            }
        }
        if (i === len) r = len - 1;
    } else if (bh === offset) {
        r = begin;
    } else {
        for (var i = begin - 1; i >= 0; i--) {
            if (_cache.pIndexOf(i, len, childNodes(), 1) <= offset) {
                r = i;
                break;
            }
        }
    }
    return childNodes()[r];
};

var updateElement = function (el, offset, notAllChecked, onlyDown) {
    if (_conf.mode === 0 || _conf.itemHeightFixed) return;

    if (typeof el === 'number') {
        el = getTouchedElement(el, offset);
    }

    var idx = parseInt(el.getAttribute('data-key'));
    var newH = el.offsetHeight;
    var d = newH - _cache.hIndex[idx];
    if (d !== 0) {
        for (var i = idx, len = _cache.hIndex.length; i < len; i++) {
            if (_cache.rIndex[i] === true) continue;
            _cache.hIndex[i] += d;
            _cache.pIndex[i] += d;
        }

        updateByForce(!!notAllChecked, onlyDown);
    }
};

var HidingPlugin = {
    onInit: init,
    onScrollStart: function (el, data) {
        updateElement(data.touchY, -data.position, false, false);
        // updateOnTouchStart(-data.position);
    },
    onScrollEnd: function (el, data) {
        updateOnTouchEnd(-data.endPosition);
    },
    onElementUpdate: function (el) {
        updateElement(el);
    },
    onElementRemove: function (el) {
        var index = parseInt(el.getAttribute('data-key'));
        _cache.rIndex[index] = true;
    },
    onElementAdd: function (el) {
        updateOnElementAdd();
    }
};

var Skroll = function (dom, conf) {
    if (!conf) conf = {};
    if (conf.autoHide !== false) conf.autoHide = true;
    var page,
        scrollBar,
        pageScrolling = false,
        itemHeightFixed = false,
        _itemHeight = 0,
        itemHeight = function () {
            if (_itemHeight === 0) {
                var len = page.children.length;
                if (filler === 2) len -= 2;
                if (len <= 0) return 0;
                _itemHeight = page.children[filler === 2 ? 1 : 0].offsetHeight;
            }
            return _itemHeight;
        },
        filler = conf.filler || 1, // 1: padding, 2: blank
        curScrollStartTime = 0,
        plugins,
        heightOf = {
            page: 0,
            parent: 0,
            bar: 0,
            foo: 0
        },
        startX,
        startY,
        startTop,
        thenX, thenY, nowX, nowY,
        lastMoveTime,
        lastLastMoveTime,
        totalDistX,
        totalDistY,
        threshold = 150, //required min distance traveled to be considered swipe
        restraint = 100, // maximum distance allowed at the same time in perpendicular direction
        allowedTime = 300, // maximum time allowed to travel that distance
        thresholdTime = 100,
        acceleration = 4000,
        initialSpeed,
        initialPosition,
        maxSpeed = 6000,
        heightLock = false, // lock the height of page, when touchstart or touchend; notice window.screen.height
        startTime, endTime,
        scrollPosition = 0,
        distXIntervals = [],
        distYIntervals = [],
        timeIntervals = [],
        scrollBarConf = {
            draggable: false,
            minHeight: 8,
            hideDelay: 1000,
            mode: 1 // 0: hidden, 1: autoShow, 2: alwaysShow
        },
        ifRequestAnimationFrame,
        requestAnimationFrame = raf,
        scrollBarData = {
            hideTimeout: null,
            thenX: null,
            nowX: null,
            thenY: null,
            nowY: null,
            startX: null,
            startY: null,
            totalDistX: null,
            totalDistY: null,
            startTop: null,
            startTime: null,
            lastMoveTime: null,
            lastLastMoveTime: null,
            scrollPosition: 0
        };

    var _pageParentHeight = 0;
    var pageParentHeight = function () {
        if (_pageParentHeight === 0) updatePageParentHeight();
        return _pageParentHeight;
    };
    var updatePageParentHeight = function (e) {
        _pageParentHeight = page.parentNode.clientHeight;
    };
    var pageHeight = function () {
        if (itemHeightFixed) return (filler === 2 ? (page.children.length - 2) : page.children.length) * itemHeight();
        return page.clientHeight;
    };
    window.addEventListener('resize', updatePageParentHeight, false);

    var ScrollHelp = {
        updateHeights: function () {
            heightOf.parent = heightOf.foo = pageParentHeight(); // clientHeight / offsetHeight / getBoundingClientRect ?
            heightOf.page = pageHeight();
            heightOf.bar = Math.max(heightOf.foo * heightOf.parent / heightOf.page, scrollBarConf.minHeight);
        },
        lockPageHeight: function (h) {
            if (h > heightOf.page) {
                this.unlockPageHeight();
                return;
            }
            page.style.height = h + 'px';
            page.style.overflow = 'hidden';
        },
        unlockPageHeight: function () {
            page.style.height = '';
            page.style.overflow = '';
        },
        getScrollBar: function () {
            if (scrollBar) return scrollBar;
            var p = page.parentNode;
            if (!p) return null;
            var b = p.getElementsByClassName('scroll-foo');
            if (!b || !b.length) {
                var f = document.createElement('div');
                b = document.createElement('div');
                f.className = 'scroll-foo';
                f.setAttribute('style',
                    'position: absolute;top: 0;right: 0;width: 8px;height: 100%;background-color: rgba(204, 204, 204, 0.6);z-index: 100;\
                    -webkit-transition: opacity 0.3s ease;\
                    -moz-transition: opacity 0.3s ease;\
                    -ms-transition: opacity 0.3s ease;\
                    -o-transition: opacity 0.3s ease;\
                    transition: opacity 0.3s ease;' +
                    (scrollBarConf.mode === 1 ? 'opacity: 0;display: none;' : ''));
                b.setAttribute('style',
                    'position: relative;top: 0;right: 0;background-color: #666;width: 8px;height: 0;border-radius: 4px;'
                );
                f.appendChild(b);
                p.appendChild(f);

                ScrollHelp.updateHeights();

                b.style.height = heightOf.bar + 'px';

                b.addEventListener('touchstart', function (e) {
                    if (!scrollBarConf.draggable) return;

                    var touchobj = e.changedTouches[0];
                    scrollBarData.thenX = scrollBarData.nowX = scrollBarData.startX = touchobj.pageX;
                    scrollBarData.thenY = scrollBarData.nowY = scrollBarData.startY = touchobj.pageY;
                    scrollBarData.startTime = scrollBarData.lastLastMoveTime = scrollBarData.lastMoveTime = Date.now();
                    scrollBarData.startTop = scrollBarData.scrollPosition = ScrollHelp.stopTranslate(this, scrollBarData.scrollPosition, 'bar');

                    scrollPosition = ScrollHelp.stopTranslate(page, scrollPosition);

                    ScrollHelp.updateHeights();

                    if (scrollBarConf.mode === 1) {
                        this.parentNode.style.display = 'block';
                        this.parentNode.style.opacity = '1';
                        if (scrollBarData.hideTimeout != null) {
                            window.clearTimeout(scrollBarData.hideTimeout);
                        }
                    }

                    e.preventDefault();
                }, false);

                b.addEventListener('touchmove', function (e) {
                    if (!scrollBarConf.draggable) return;

                    if (heightOf.bar >= heightOf.foo) {
                        return;
                    }
                    var touchobj = e.changedTouches[0];

                    var newY = scrollBarData.startTop + touchobj.pageY - scrollBarData.startY;
                    if (newY < 0) newY = 0;
                    var maxTranslateY = ScrollHelp.getMaxTranslate('bar', this);
                    if (newY > maxTranslateY) newY = maxTranslateY;
                    scrollBarData.scrollPosition = ScrollHelp.setTranslate('bar', this,
                        newY, true);

                    scrollBarData.thenX = scrollBarData.nowX;
                    scrollBarData.nowX = touchobj.pageX;
                    scrollBarData.thenY = scrollBarData.nowY;
                    scrollBarData.nowY = touchobj.pageY;
                    scrollBarData.lastLastMoveTime = scrollBarData.lastMoveTime;
                    scrollBarData.lastMoveTime = Date.now();

                    ScrollHelp.setTranslate('page', page, -(heightOf.page - heightOf.parent) * (newY /
                        (heightOf.foo - heightOf.bar)));

                    e.preventDefault(); // prevent scrolling when inside DIV
                }, false);

                b.addEventListener('touchend', function (e) {
                    if (!scrollBarConf.draggable) return;

                    if (scrollBarConf.mode === 1) {
                        scrollBarData.hideTimeout = window.setTimeout(function () {
                            this.parentNode.style.opacity = '0';
                        }.bind(this), scrollBarConf.hideDelay);
                    }
                    e.preventDefault();
                }, false);
            } else {
                b = b[0].children[0];
            }
            scrollBar = b;
            return b;
        },
        calSpeed: function (dists, times, dist, time) {
            var len = dists.length;
            var r = 2;
            if (len <= 0) return 0;
            if (len === 1) {
                if (times[0] <= 0) return 0;
                return dists[0] / times[0];
            }
            if (len < 2 * r) {
                return dist / time;
            }
            var d1, t1, d2, t2, ta;
            d1 = d2 = 0;
            t1 = t2 = ta = 0;
            for (var i = 1; i <= r; i++) {
                d1 += dists[len - i];
                t1 += times[len - i];
                d2 += dists[len - i - r];
                t2 += times[len - i - r];
            }
            if (len < 3 * r) {
                var t = (t1 + t2) / 2;
                return (d1 / t) * 2 - d2 / t;
            }
            var d3, t3;
            d3 = t3 = 0;
            for (var i = len - 1 - 2 * r; i >= len - 3 * r; i--) {
                d3 += dists[i];
                t3 += times[i];
            }
            var t = (t1 + t2 + t3) / 3;
            return d1 / t + d2 / t - d3 / t;
        },
        getMaxTranslate: function (id, el) {
            if (id === 'page') return heightOf.parent - heightOf.page;
            return heightOf.foo - heightOf.bar;
        },
        _setT: function (el, t) {
            el.style.transform = el.style.WebkitTransform = 'translate3d(0,' + t + 'px,0)'; // 'translateY(' + t + 'px)';
        },
        setTranslate: function (id, el, d, r) {
            var t = d || 0;
            if (!r) {
                if (t > 0) t = 0;
                else if (t < this.getMaxTranslate(id, el)) t = this.getMaxTranslate(id, el);
            } else {
                if (t < 0) t = 0;
                else if (t > this.getMaxTranslate(id, el)) t = this.getMaxTranslate(id, el);
            }

            var tt = t;

            if (ifRequestAnimationFrame) {
                requestAnimationFrame((function (_el, _t) {
                    return function () {
                        ScrollHelp._setT(_el, _t);
                    };
                })(el, t));
            } else {
                ScrollHelp._setT(el, t);
            }

            return tt;
        },
        _calTranslate: function (s0, v, a) {
            return parseFloat(s0) + (v > 0 ? 1 : -1) * v * v / (2 * Math.abs(a));
        },
        _setTransitionClass: function (el, time, x1, y1, x2, y2) {
            var t = (time === false) ? x1 : ('transform ' + time + 's cubic-bezier(' + x1 +
                ', ' + y1 + ', ' + x2 + ', ' + y2 + ')');
            el.style.transition = el.style.WebkitTransition = t;
            return t;
        },
        updateTransition: function (id, el, v, a, p, _b0, _b1) {
            if (a > 0) a = -a;
            var b0 = _b0 || 0,
                b1 = _b1 || this.getMaxTranslate(id, el),
                newP = this._calTranslate(p, v, a),
                d = 0;

            if (newP > b0) d = b0 - p;
            else if (newP < b1) d = p - b1;
            else d = Math.abs(newP - p);

            v = Math.abs(v);

            var foo = v * v + 2 * a * d;
            if (foo < 0) foo = 0;
            var time = (Math.sqrt(foo) - v) / a,
                x1 = 1 / 3,
                y1 = v * time / d / 3,
                x2 = x1 + 1 / 3,
                y2 = y1 + 1 / 3;

            var t = this._setTransitionClass(el, time, x1, y1, x2, y2);

            return {
                position: this.setTranslate(id, el, newP),
                distance: d,
                time: time,
                transition: t
            };
        },
        stopTranslate: function (el, opos, isScrollBar) {
            var t;
            if (pageScrolling) {
                var dt = (startTime - endTime) / 1000;
                t = initialPosition + (initialSpeed * dt + (initialSpeed > 0 ? -1 : 1) * acceleration * dt * dt / 2);
                if (isScrollBar) t /= -heightOf.page / heightOf.foo;
                el.style.transform = el.style.WebkitTransform = 'translate3d(0,' + t + 'px,0)';
            } else {
                if (opos == null) {
                    t = el.style.transform;
                    if (!t || t === 'none') t = el.style.WebkitTransform;
                    if (t && t !== 'none') {
                        t = t.substring(t.indexOf(', ') + 2, t.lastIndexOf(', '));
                    }
                } else {
                    t = opos;
                }
            }

            if (!t || t === 'none') {
                t = 0;
            }

            el.style.transition = el.style.WebkitTransition = '';

            return parseFloat(t);
        }
    };

    var putPlugins = function () {
        var ens = initQueues.names;
        var pl = null;
        for (var i = 0, ilen = plugins.length; i < ilen; i++) {
            pl = plugins[i];
            for (var j = 0, jlen = ens.length; j < jlen; j++) {
                if (pl['on' + ens[j]]) {
                    initQueues['on' + ens[j]].push(pl['on' + ens[j]]);
                }
            }
        }

        ens = scrollEventQueues.names;
        pl = null;
        for (var i = 0, ilen = plugins.length; i < ilen; i++) {
            pl = plugins[i];
            for (var j = 0, jlen = ens.length; j < jlen; j++) {
                if (pl['onScroll' + ens[j]]) {
                    scrollEventQueues['on' + ens[j]].push(pl['onScroll' + ens[j]]);
                }
            }
        }

        ens = elementEventQueues.names;
        pl = null;
        for (var i = 0, ilen = plugins.length; i < ilen; i++) {
            pl = plugins[i];
            for (var j = 0, jlen = ens.length; j < jlen; j++) {
                if (pl['onElement' + ens[j]]) {
                    elementEventQueues['on' + ens[j]].push(pl['onElement' + ens[j]]);
                }
            }
        }
    };

    var initQueues = {
        names: ['Init'],
        onInit: [],
        init: function (el, data) {
            for (var i = 0, len = this.onInit.length; i < len; i++) {
                this.onInit[i](el, conf, data);
            }
        }
    };

    var elementEventQueues = {
        names: ['Add', 'Remove', 'Update'],
        onAdd: [],
        onRemove: [],
        onUpdate: [],
        add: function (el) {
            for (var i = 0, len = this.onAdd.length; i < len; i++) {
                this.onAdd[i](el);
            }
        },
        remove: function (el) {
            for (var i = 0, len = this.onRemove.length; i < len; i++) {
                this.onRemove[i](el);
            }
        },
        update: function (el) {
            for (var i = 0, len = this.onUpdate.length; i < len; i++) {
                this.onUpdate[i](el);
            }
        }
    };

    var scrollEventQueues = {
        names: ['Start', 'Pause', 'Move', 'End'],
        onStart: [], // start a scroll, and actually pause a scroll at the same time
        onMove: [],
        onEnd: [],
        start: function (el, data) {
            for (var i = 0, len = this.onStart.length; i < len; i++) {
                this.onStart[i](el, data);
            }
        },
        move: function (el, data) {
            for (var i = 0, len = this.onMove.length; i < len; i++) {
                this.onMove[i](el, data);
            }
        },
        end: function (el, data) {
            for (var i = 0, len = this.onEnd.length; i < len; i++) {
                this.onEnd[i](el, data);
            }
        }
    };

    page = dom;
    itemHeightFixed = conf.itemHeightFixed || itemHeightFixed;
    acceleration = conf.acceleration || acceleration;
    maxSpeed = conf.maxSpeed || maxSpeed;
    scrollBarConf.mode = conf.scrollBarMode || scrollBarConf.mode;
    ifRequestAnimationFrame = conf.raf !== false;

    ScrollHelp.updateHeights();

    plugins = conf.plugins || [];
    conf.autoHide && plugins.push(HidingPlugin);
    putPlugins();
    initQueues.init(page);

    /* initialize the scroll bar */
    if (scrollBarConf.mode !== 0) ScrollHelp.getScrollBar();

    page.addEventListener('touchstart', function (e) {
        var touchobj = e.changedTouches[0];
        thenX = nowX = startX = touchobj.pageX;
        thenY = nowY = startY = touchobj.pageY;
        startTime = lastLastMoveTime = lastMoveTime = Date.now();

        startTop = scrollPosition = ScrollHelp.stopTranslate(this, scrollPosition);

        ScrollHelp.updateHeights(); // Is this necessary?

        if (heightLock) ScrollHelp.lockPageHeight(scrollPosition + window.screen.height * 2);

        if (scrollBarConf.mode !== 0 && heightOf.parent && heightOf.page && heightOf.parent <
            heightOf.page) {
            var b = ScrollHelp.getScrollBar();
            if (scrollBarConf.mode === 1) {
                b.parentNode.style.display = 'block';
                b.parentNode.style.opacity = '1';
                if (scrollBarData.hideTimeout != null) {
                    window.clearTimeout(scrollBarData.hideTimeout);
                }
            }
            b.style.height = heightOf.bar + 'px';
            scrollBarData.scrollPosition = ScrollHelp.stopTranslate(b, scrollBarData.scrollPosition, 'bar');
        }

        pageScrolling = false;

        distXIntervals = [],
            distYIntervals = [],
            timeIntervals = [];

        scrollEventQueues.start(this, {
            position: startTop,
            touchY: startY
        });

        e.preventDefault();
    }, false);

    page.addEventListener('touchmove', function (e) {
        if (heightOf.page <= heightOf.parent) {
            return;
        }
        var touchobj = e.changedTouches[0];

        var newY = startTop + touchobj.pageY - startY;
        if (newY > 0) newY = 0;
        var maxTranslateY = ScrollHelp.getMaxTranslate('page', this);
        if (newY < maxTranslateY) newY = maxTranslateY;
        scrollPosition = ScrollHelp.setTranslate('page', this, newY);

        thenX = nowX;
        nowX = touchobj.pageX;
        thenY = nowY;
        nowY = touchobj.pageY;
        lastLastMoveTime = lastMoveTime;
        lastMoveTime = Date.now();

        distXIntervals.push(nowX - thenX);
        distYIntervals.push(nowY - thenY);
        timeIntervals.push(lastMoveTime - lastLastMoveTime);

        if (scrollBarConf.mode !== 0 && heightOf.parent && heightOf.page) {
            ScrollHelp.setTranslate('bar', ScrollHelp.getScrollBar(), -(heightOf.foo - heightOf.bar) * (newY /
                (heightOf.page - heightOf.parent)), true);
        }

        e.preventDefault(); // prevent scrolling when inside DIV
    }, false);

    page.addEventListener('touchend', function (e) {
        var touchobj = e.changedTouches[0];
        totalDistX = touchobj.pageX - startX;
        totalDistY = touchobj.pageY - startY;
        var dateNow = Date.now();
        var elapsedTime = dateNow - startTime;
        var scrollDir = null;
        if (elapsedTime <= allowedTime) {
            if (Math.abs(totalDistX) >= threshold && Math.abs(totalDistY) <= restraint) {
                scrollDir = (totalDistX < 0) ? 'left' : 'right';
            } else if (Math.abs(totalDistY) >= threshold && Math.abs(totalDistX) <= restraint) {
                scrollDir = (totalDistY < 0) ? 'up' : 'down';
            }
        }

        pageScrolling = false;

        endTime = dateNow;
        var curPosition = scrollPosition;
        initialPosition = scrollPosition;
        var transBoundary = ScrollHelp.getMaxTranslate('page', this);
        if (endTime - lastMoveTime < thresholdTime && heightOf.parent && heightOf.page &&
            heightOf.parent < heightOf.page) {
            initialSpeed = 1000 * ScrollHelp.calSpeed(distYIntervals, timeIntervals,
                totalDistY, elapsedTime);
            if (Math.abs(initialSpeed) > maxSpeed) {
                initialSpeed = (initialSpeed < 0 ? -maxSpeed : maxSpeed);
            }

            var transResult = ScrollHelp.updateTransition('page', this, initialSpeed,
                acceleration, scrollPosition, 0, transBoundary);
            curPosition = scrollPosition = transResult.position;
            scrollBarData.scrollPosition = -curPosition / heightOf.page * heightOf.foo;

            pageScrolling = true;
            curScrollStartTime = dateNow;
            window.setTimeout(function (thisDateNow) {
                return function () {
                    if (curScrollStartTime <= thisDateNow) pageScrolling = false;
                };
            }(dateNow), transResult.time * 1000);

            if (scrollBarConf.mode !== 0) {
                var b = ScrollHelp.getScrollBar();
                ScrollHelp._setTransitionClass(b, false, transResult.transition);
                ScrollHelp.setTranslate('bar', b, -(heightOf.foo - heightOf.bar) * (curPosition /
                    (heightOf.page - heightOf.parent)),
                    true);
                if (scrollBarConf.mode === 1) {
                    scrollBarData.hideTimeout = window.setTimeout(function () {
                        b.parentNode.style.opacity = '0';
                    }, transResult.time * 1000 + scrollBarConf.hideDelay);
                }
            }

            if (heightLock) ScrollHelp.lockPageHeight(scrollPosition + window.screen.height * 2);

            scrollEventQueues.end(this, {
                scrollDir: scrollDir,
                totalDistX: totalDistX,
                totalDistY: totalDistY,
                elapsedTime: elapsedTime,
                distXIntervals: distXIntervals,
                distYIntervals: distYIntervals,
                timeIntervals: timeIntervals,
                endPosition: curPosition,
                startPosition: startTop,
                transBoundary: transBoundary
            });
        }

        e.preventDefault();
    }, false);

    var resizeObserve = function (el) {
        var ifObserveChild = false;
        if (!ifObserveChild || itemHeightFixed) return;

        /* MutationObserver way */
        if ('MutationObserver' in window) {
            var target = el;
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    console.log('mutation');
                    // elementEventQueues.update(target);
                });
            });

            observer.observe(target, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: false
            });
        }

        /* ResizeSensor way */
        // new ResizeSensor(el, function () {
        //     elementEventQueues.update(el);
        // });
    };

    /* initialize observers for children */
    for (var i = 0, len = page.children.length; i < len; i++) {
        resizeObserve(page.children[i]);
    }

    var _appendChild = page.appendChild;
    this.append = page.appendChild = function (el) {
        _appendChild.call(page, el);
        elementEventQueues.add(el);
        resizeObserve(el);
    };
    this.remove = page.removeChild = function (el) {
        el.style.display = 'none';
        elementEventQueues.remove(el);
    };
    this.update = page.updateChild = function (el) {
        elementEventQueues.update(el);
    };
};

return Skroll;

})));
//# sourceMappingURL=Skroll.js.map
