(function($){

    var filterString = thebuilders_one_page_opt.filterArray;
    var navType      = thebuilders_one_page_opt.navType;
    var speed        = thebuilders_one_page_opt.speed;
    var hash         = thebuilders_one_page_opt.hash;
    var offset       = thebuilders_one_page_opt.offset;

    console.log(offset);

    if(navType == "top"){
        $('ul#header-menu').singlePageNav({
            currentClass: 'one-page-active',
            speed: speed,
            easing: "swing",
            updateHash: hash,
            filter:':not('+filterString+')',
            offset:offset
        });
    } else {
        $('ul#one-page-bullets').singlePageNav({
            currentClass: 'one-page-active',
            speed: speed,
            easing: "swing",
            updateHash: hash,
            filter:':not('+filterString+')',
            offset:offset
        }); 
    }

})(jQuery);