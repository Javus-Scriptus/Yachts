const uglify = require('rollup-plugin-uglify');

module.exports = {
    input: 'src/index.js',
    name: 'Skroll',
    output: {
        file: 'dist/Skroll.min.js',
        format: 'umd'
    },
    plugins: [
        uglify()
    ]
};
