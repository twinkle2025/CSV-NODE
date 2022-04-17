/**
  * LoDash
  */
 window._ = require('lodash');

 /**
  * jQuery + Bootstrap
  */
try {
    window.$ = window.jQuery = require('jquery');
    window.Popper = require('popper.js').default;
    require('jquery-ui/ui/widgets/autocomplete');
    require('chosen-js');
    require('bootstrap');
    require('jquery-validation');
    require('../limitless/global_assets/js/plugins/forms/tags/tagsinput.min.js');
    require('../limitless/global_assets/js/plugins/forms/tags/tokenfield.min.js');
    require('../limitless/global_assets/js/plugins/extensions/session_timeout.min.js');
    require('../limitless/global_assets/js/plugins/pickers/daterangepicker');
    window.$.fn.block = () => {};
    window.$.fn.unblock = () => {};
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })
    require('../limitless/global_assets/js/plugins/tables/datatables/datatables.min.js');
    jQuery.extend( jQuery.fn.dataTable.defaults, {
      autoWidth: false,
      dom: '<"datatable-header"fl><"datatable-scroll"t><"datatable-footer"ip>',
      language: {
          search: '<span>Filter:</span> _INPUT_',
          searchPlaceholder: 'Type to filter...',
          lengthMenu: '<span>Show:</span> _MENU_',
          paginate: { 'first': 'First', 'last': 'Last', 'next': jQuery('html').attr('dir') == 'rtl' ? '&larr;' : '&rarr;', 'previous': jQuery('html').attr('dir') == 'rtl' ? '&rarr;' : '&larr;' }
      }
  });
 } catch (e) {
   console.warn(e.toString());
 }

/**
 * Function to convert form inputs into json objects
 */
window.getFormData = (jQueryForm) => {
  const formArray = jQueryForm.serializeArray();
  let returnObject = {};
  for (let i = 0; i < formArray.length; i++) {
    const field = formArray[i];
    if (typeof (returnObject[field.name]) === 'undefined') {
      returnObject[field.name] = field.value;
    } else {
      returnObject[field.name] = [returnObject[field.name]];
      returnObject[field.name].push(field.value);
    }
  }
  return returnObject;
};

/**
 * MD5 Function
 */
window.md5 = require('md5');

/**
 * Moment & Moment Timezone
 */
try {
  window.moment = require('moment-timezone');
} catch (e) {}

/**
 * PNotify
 */
window.PNotify = require('pnotify');
window.PNotify.notice = function(options) {
  options.addclass = 'growl';
  options.icon = ('undefined' == typeof(options.icon)) ? 'fas fa-flag' : options.icon;
  let notice = new PNotify(options);
  notice.get().click(function() {
          notice.remove();
  });
  return notice;
}
window.PNotify.info = function(options) {
  options.addclass = 'alert alert-info';
  options.icon = 'fas fa-exclamation-circle';
  let notice = new PNotify(options);	
  notice.get().click(function() {
          notice.remove();
  });
  return notice;
}
window.PNotify.success = function(options) {
  options.addclass = 'alert alert-success';
  options.icon = 'fas fa-check';
  let notice = new PNotify(options);
  notice.get().click(function() {
          notice.remove();
  });
  return notice;
}
window.PNotify.warning = function(options) {
  options.addclass = 'alert alert-warning';
  options.icon = 'fas fa-exclamation-triangle';
  let notice = new PNotify(options);
  notice.get().click(function() {
          notice.remove();
  });
  return notice;
}
window.PNotify.danger = function(options) {
  options.addclass = 'alert alert-danger';
  options.icon = 'fas fa-times-circle';
  let notice = new PNotify(options);
  notice.get().click(function() {
          notice.remove();
  });
  return notice;
}
window.PNotify.alert = function(options) {
  options.addclass = 'growl';
  options.icon = 'fas fa-exclamation-triangle';
  let notice = new PNotify(options);
  notice.get().click(function() {
          notice.remove();
  });
  return notice;
}
/**
 * Axios
 */
window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.baseURL = `${window.location.origin}/api/v1`;

/**
 * Clipboard JS
 */
import ClipboardJS from 'clipboard';
window.ClipboardJS = ClipboardJS;


/**
 * TinyMCE
 */
import tinymce from 'tinymce/tinymce';

// A theme is also required
import 'tinymce/themes/silver';

// Any plugins you want to use has to be imported
import 'tinymce/plugins/paste';
import 'tinymce/plugins/link';
window.tinymce = tinymce;