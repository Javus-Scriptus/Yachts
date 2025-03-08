<h1 align="center">skroll</h1>

![gzip size](http://img.badgesize.io/https://raw.githubusercontent.com/shenfe/skroll/master/dist/Skroll.min.js?compression=gzip)
<a href="https://www.npmjs.com/package/skroll"><img src="https://img.shields.io/npm/v/skroll.svg"></a>
![downloads](https://img.shields.io/npm/dm/skroll.svg)
![license](https://img.shields.io/npm/l/skroll.svg)

手动实现适用于移动端的滚动。

## Demo

[Demo](http://shenfe.github.io/repos/skroll/test/test.html)

## Usage

在需要滚动的元素ready后，即可调用Skroll实现滚动。

```js
// <div style="position:relative;overflow:hidden;">
//     <div id="target" style="position:relative;"></div>
// </div>
new Skroll(document.getElementById('target'), {
    acceleration: 2000,     // deceleration of the sliding target in fact
    maxSpeed: 4000,         // maximum speed of the target
    itemHeightFixed: false, // false (default): no matter what children are like; true: optimized if the target's each child is of a fixed height
    scrollBarMode: 1        // 0: hidden; 1 (default): auto; 1: visible
});
```

## Compatibility

适用于移动端。

## Testing

### 自动隐藏与否对比

| 方式 | 测试链接 |
| :---: | :---: |
| 自动隐藏 | [test-skroll.html?size=1000&content=1](http://shenfe.github.io/repos/skroll/test/test-skroll.html?size=1000&content=1) |
| 不隐藏 | [test-skroll.html?size=1000&content=1&hide=false](http://shenfe.github.io/repos/skroll/test/test-skroll.html?size=1000&content=1&hide=false) |

### 不同滚动对比

| 方式 | 测试链接 |
| :---: | :---: |
| 高度固定自动隐藏模拟滚动 | [test-skroll.html?size=10000&content=0&height=true](http://shenfe.github.io/repos/skroll/test/test-skroll.html?size=10000&content=0&height=true) |
| 高度固定不隐藏模拟滚动 | [test-skroll.html?size=10000&content=0&height=true&hide=false](http://shenfe.github.io/repos/skroll/test/test-skroll.html?size=10000&content=0&height=true&hide=false) |
| iscroll | [test-iscroll.html?size=10000&content=0&method=iscroll](http://shenfe.github.io/repos/skroll/test/test-iscroll.html?size=10000&content=0&method=iscroll) |
| 原生 | [test-native.html?size=10000&content=0&method=native](http://shenfe.github.io/repos/skroll/test/test-native.html?size=10000&content=0&method=native) |

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016-present, [shenfe](https://github.com/shenfe)
