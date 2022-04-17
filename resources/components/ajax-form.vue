<template>
    <form :id="this._uid" class="needs-validation" novalidate>
        <slot></slot>
    </form>
</template>

<script>
    export default {
        mounted() {
            jQuery('#' + this._uid).validate({
                submitHandler: (form, event) => {
                    event.preventDefault();
                    const f = jQuery(form);
                    const data = f.find('input, textarea, select').filter((index, element) => {
                        if (jQuery(element).is('[type="checkbox"]') || jQuery(element).is('[type="radio"]')) {
                            return jQuery(element).is(':checked');
                        } else {
                            return jQuery(element).val() != '';
                        }
                    }).serialize();
                    const action = ('POST' === f.attr('method') || 'PUT' === f.attr('method') || 'PATCH' === f.attr('method')) ? f.attr('action') : f.attr('action') + '?' + data;
                    f.find('input, textarea, select, button').prop('disabled', true);
                    axios(action, {
                        method: f.attr('method'),
                        data,
                    })
                    .then( (response) => {
                        f.trigger('success', response.data);
                        this.$emit('success', response.data);
                        f.find('input, textarea, select, button').prop('disabled', false);
                    })
                    .catch( (error) => {
                        handleAxiosError(error);
                        f.trigger('error', error);
                        this.$emit('error', error);
                        f.find('input, textarea, select, button').prop('disabled', false);
                    });
                },
                rules: {},
                messages: {},
                errorClass: 'is-invalid',
                validClass: 'is-valid',
                errorElement: 'span',
                ignore: ':hidden, .validation-ignore, readonly, disabled',
                errorPlacement: (error, element) => {
                    jQuery(element).closest('.form-group').find('.invalid-feedback').remove();
                    jQuery(error).removeClass('is-invalid').addClass('invalid-feedback');
                    if (jQuery(element).closest('.form-group').find('.pass-wrapper').length > 0) {
                        jQuery(element).closest('.form-group').find('.pass-wrapper').after(error);
                    } else {
                        jQuery(element).after(error);
                    }
                },
                highlight: (element, errorClass, validClass) => {
                    const field = jQuery(element);
                    const select2 = field.closest('.form-group').find('.select2');
                    field.removeClass(validClass).addClass(errorClass);
                    select2.removeClass(validClass).addClass(errorClass);
                },
                unhighlight: (element, errorClass, validClass) => {
                    const field = jQuery(element);
                    const select2 = field.closest('.form-group').find('.select2');
                    field.addClass(validClass).removeClass(errorClass);
                    select2.addClass(validClass).removeClass(errorClass);
                }
            });
        }
    }
</script>