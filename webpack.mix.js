const { mix } = require('webpack-mix');
const moment = require('moment-timezone');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');

mix.setPublicPath('public/assets')
   .setResourceRoot('/assets/')
   .copyDirectory('resources/limitless/global_assets/css/icons/icomoon/fonts', 'public/assets/fonts')
   .copyDirectory('resources/images', 'public/assets/images')
   .js('resources/js/scripts.js', 'public/assets/app.js')
   .js('resources/js/pwa.js', 'public/assets/pwa.js')
   .babel('resources/js/push.js', 'public/assets/push.js')
   .sass('resources/sass/styles.scss', 'public/assets/app.css')
   .extract([
      'vue',
      'jquery',
      'jquery-ui',
      'popper.js',
      'bootstrap',
      'highcharts',
      'jquery-validation',
   ])
   .styles([
      'node_modules/pnotify/dist/pnotify.css',
      'node_modules/animate.css/animate.css',
      'resources/limitless/global_assets/css/icons/icomoon/styles.css',
   ], 'public/assets/vendor.css').options({
      postCss: [
            require('postcss-discard-comments')({
               removeAll: true
            })
      ]
   })
   .copy('node_modules/tinymce/skins/ui/oxide/skin.min.css', 'public/assets/skins/ui/oxide/skin.min.css')
   .copy('node_modules/tinymce/skins/ui/oxide/content.min.css', 'public/assets/skins/ui/oxide/content.min.css')
   .copy('node_modules/tinymce/skins/content/default/content.css', 'public/assets/skins/content/default/content.css')
   .copyDirectory('node_modules/tinymce/plugins', 'public/assets/plugins')
   .version()
   .sourceMaps()
   .webpackConfig({
      plugins: [
         new SWPrecacheWebpackPlugin({
            cacheId: 'pwa',
            filename: '../service-worker.js',
            staticFileGlobs: ['public/**/*.{css,eot,svg,ttf,woff,woff2,js,html}'],
            minify: mix.inProduction(),
            stripPrefix: 'public',
            handleFetch: true,
            dynamicUrlToDependencies: {
               '/': ['resources/views/pwa.edge'],
            },
            staticFileGlobsIgnorePatterns: [/\.map$/, /mix-manifest\.json$/, /manifest\.json$/, /service-worker\.js$/],
            importScripts:[
               `/assets/push.js?${moment().format('x')}`,
            ],
         })
      ]
   });