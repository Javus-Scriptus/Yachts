define(['domock'], function (Domock) {
    var generateContent1 = function(div, levels) {
        for (var i = 0; i < levels[0]; i++) {
            var child = document.createElement('div');
            child.className = 'test-div';
            child.innerHTML = i;
            div.appendChild(child);
        }
    };
    var generateContent2 = function(div, levels) {
        Domock(div, levels);
    };
    return [generateContent1, generateContent2];
});
