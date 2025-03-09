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