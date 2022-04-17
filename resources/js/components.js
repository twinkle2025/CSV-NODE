import Vue from 'vue';

const components = (ctx => {
    let keys = ctx.keys();
    let values = keys.map(ctx);
    let map = new Map();
    for (var i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];
        const match = key.match(/.\/([a-zA-Z0-9\/\-\_]+)\.vue$/i);
        if (null !== match) {
            const originalName = match[1];
            const name = `${originalName.replace(/\//g, '-')}`
            const component = Vue.component(name, value);
            map.set(name, component);
        }
    }
    return map;
})(require.context('../components', true, /\.vue/));

export default components;