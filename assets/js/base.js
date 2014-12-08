

/**
 * nav bar show control
 */
function nav_show(is_show)
{
    if (is_show) {
        $('.nav__bar')
            .addClass('visible-md visible-lg fadein')
            .removeClass('hidden-md hidden-lg');

        $('.page__container')
            .addClass('col-md-8 col-gl-8')
            .removeClass('col-md-12 col-gl-12');
    } else {
        $('.nav__bar')
            .addClass('hidden-md hidden-lg fadeout')
            .removeClass('visible-md visible-lg');

        $('.page__container')
            .addClass('col-md-12 col-gl-12')
            .removeClass('col-md-8 col-gl-8');
    }
}

$(document).ready(function() {
        /*
         * pjax
         */
        $(document).pjax('.pjax-selector', '#pjax-container', {
            fragment: "#pjax-container",
            timeout: 10000
        });

        $(document).on({
            'pjax:click': function() {
                NProgress.start();
                $('#pjax-container').removeClass('fadeIn').addClass('fadeOut');
            },
            'pjax:start': function() {
                $('#pjax-container').css({'opacity':0});
            },
            'pjax:end': function() {
                $('#pjax-container').css({'opacity':1}).removeClass('fadeOut').addClass('fadeIn');
                $('.page__container').scrollTop(0);
                NProgress.done();
            }
        });

        /**
         * nav bottom
         */
        $('#nav_btn').on('click', function() {
            is_show = $(this).data('is_show');
            nav_show(is_show);
            $(this).data('is_show', !is_show);
        });

        /**
         * post list active
         */
        $('.list-group-item').on('click', function() {
            $(this).addClass('active').siblings().removeClass('active');
        });

        $('a[data-toggle="pill"]').on('hide.bs.tab', function(e) {
            $('.list-group-item').siblings().removeClass('active');
        });
    }
);
