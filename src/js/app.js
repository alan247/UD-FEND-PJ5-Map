
(function($, window, document, undefined) {

    'use strict';

    var defaults = {

        mode: 'lg-slide',

        // Ex : 'ease'
        cssEasing: 'ease',

        //'for jquery animation'
        easing: 'linear',
        speed: 600,
        height: '100%',
        width: '100%',
        addClass: '',
        startClass: 'lg-start-zoom',
        backdropDuration: 150,
        hideBarsDelay: 6000,

        useLeft: false,

        closable: true,
        loop: true,
        escKey: true,
        keyPress: true,
        controls: true,
        slideEndAnimatoin: true,
        hideControlOnEnd: false,
        mousewheel: true,

        // .lg-item || '.lg-sub-html'
        appendSubHtmlTo: '.lg-sub-html',

        /**
         * @desc number of preload slides
         * will exicute only after the current slide is fully loaded.
         *
         * @ex you clicked on 4th image and if preload = 1 then 3rd slide and 5th
         * slide will be loaded in the background after the 4th slide is fully loaded..
         * if preload is 2 then 2nd 3rd 5th 6th slides will be preloaded.. ... ...
         *
         */
        preload: 1,
        showAfterLoad: true,
        selector: '',
        selectWithin: '',
        nextHtml: '',
        prevHtml: '',

        // 0, 1
        index: false,

        iframeMaxWidth: '100%',

        download: true,
        counter: true,
        appendCounterTo: '.lg-toolbar',

        swipeThreshold: 50,
        enableSwipe: true,
        enableDrag: true,

        dynamic: false,
        dynamicEl: [],
        galleryId: 1
    };

    function Plugin(element, options) {

        // Current lightGallery element
        this.el = element;

        // Current jquery element
        this.$el = $(element);

        // lightGallery settings
        this.s = $.extend({}, defaults, options);

        // When using dynamic mode, ensure dynamicEl is an array
        if (this.s.dynamic && this.s.dynamicEl !== 'undefined' && this.s.dynamicEl.constructor === Array && !this.s.dynamicEl.length) {
            throw ('When using dynamic mode, you must also define dynamicEl as an Array.');
        }

        // lightGallery modules
        this.modules = {};

        // false when lightgallery complete first slide;
        this.lGalleryOn = false;

        this.lgBusy = false;

        // Timeout function for hiding controls;
        this.hideBartimeout = false;

        // To determine browser supports for touch events;
        this.isTouch = ('ontouchstart' in document.documentElement);

        // Disable hideControlOnEnd if sildeEndAnimation is true
        if (this.s.slideEndAnimatoin) {
            this.s.hideControlOnEnd = false;
        }

        // Gallery items
        if (this.s.dynamic) {
            this.$items = this.s.dynamicEl;
        } else {
            if (this.s.selector === 'this') {
                this.$items = this.$el;
            } else if (this.s.selector !== '') {
                if (this.s.selectWithin) {
                    this.$items = $(this.s.selectWithin).find(this.s.selector);
                } else {
                    this.$items = this.$el.find($(this.s.selector));
                }
            } else {
                this.$items = this.$el.children();
            }
        }

        // .lg-item
        this.$slide = '';

        // .lg-outer
        this.$outer = '';

        this.init();

        return this;
    }

    Plugin.prototype.init = function() {

        var _this = this;

        // s.preload should not be more than $item.length
        if (_this.s.preload > _this.$items.length) {
            _this.s.preload = _this.$items.length;
        }

        // if dynamic option is enabled execute immediately
        var _hash = window.location.hash;
        if (_hash.indexOf('lg=' + this.s.galleryId) > 0) {

            _this.index = parseInt(_hash.split('&slide=')[1], 10);

            $('body').addClass('lg-from-hash');
            if (!$('body').hasClass('lg-on')) {
                setTimeout(function() {
                    _this.build(_this.index);
                    $('body').addClass('lg-on');
                });
            }
        }

        if (_this.s.dynamic) {

            _this.$el.trigger('onBeforeOpen.lg');

            _this.index = _this.s.index || 0;

            // prevent accidental double execution
            if (!$('body').hasClass('lg-on')) {
                setTimeout(function() {
                    _this.build(_this.index);
                    $('body').addClass('lg-on');
                });
            }
        } else {

            // Using different namespace for click because click event should not unbind if selector is same object('this')
            _this.$items.on('click.lgcustom', function(event) {

                // For IE8
                try {
                    event.preventDefault();
                    event.preventDefault();
                } catch (er) {
                    event.returnValue = false;
                }

                _this.$el.trigger('onBeforeOpen.lg');

                _this.index = _this.s.index || _this.$items.index(this);

                // prevent accidental double execution
                if (!$('body').hasClass('lg-on')) {
                    _this.build(_this.index);
                    $('body').addClass('lg-on');
                }
            });
        }

    };

    Plugin.prototype.build = function(index) {

        var _this = this;

        _this.structure();

        // module constructor
        $.each($.fn.lightGallery.modules, function(key) {
            _this.modules[key] = new $.fn.lightGallery.modules[key](_this.el);
        });

        // initiate slide function
        _this.slide(index, false, false);

        if (_this.s.keyPress) {
            _this.keyPress();
        }

        if (_this.$items.length > 1) {

            _this.arrow();

            setTimeout(function() {
                _this.enableDrag();
                _this.enableSwipe();
            }, 50);

            if (_this.s.mousewheel) {
                _this.mousewheel();
            }
        }

        _this.counter();

        _this.closeGallery();

        _this.$el.trigger('onAfterOpen.lg');

        // Hide controllers if mouse doesn't move for some period
        _this.$outer.on('mousemove.lg click.lg touchstart.lg', function() {

            _this.$outer.removeClass('lg-hide-items');

            clearTimeout(_this.hideBartimeout);

            // Timeout will be cleared on each slide movement also
            _this.hideBartimeout = setTimeout(function() {
                _this.$outer.addClass('lg-hide-items');
            }, _this.s.hideBarsDelay);

        });

    };

    Plugin.prototype.structure = function() {
        var list = '';
        var controls = '';
        var i = 0;
        var subHtmlCont = '';
        var template;
        var _this = this;

        $('body').append('<div class="lg-backdrop"></div>');
        $('.lg-backdrop').css('transition-duration', this.s.backdropDuration + 'ms');

        // Create gallery items
        for (i = 0; i < this.$items.length; i++) {
            list += '<div class="lg-item"></div>';
        }

        // Create controlls
        if (this.s.controls && this.$items.length > 1) {
            controls = '<div class="lg-actions">' +
                '<div class="lg-prev lg-icon">' + this.s.prevHtml + '</div>' +
                '<div class="lg-next lg-icon">' + this.s.nextHtml + '</div>' +
                '</div>';
        }

        if (this.s.appendSubHtmlTo === '.lg-sub-html') {
            subHtmlCont = '<div class="lg-sub-html"></div>';
        }

        template = '<div class="lg-outer ' + this.s.addClass + ' ' + this.s.startClass + '">' +
            '<div class="lg" style="width:' + this.s.width + '; height:' + this.s.height + '">' +
            '<div class="lg-inner">' + list + '</div>' +
            '<div class="lg-toolbar group">' +
            '<span class="lg-close lg-icon"></span>' +
            '</div>' +
            controls +
            subHtmlCont +
            '</div>' +
            '</div>';

        $('body').append(template);
        this.$outer = $('.lg-outer');
        this.$slide = this.$outer.find('.lg-item');

        if (this.s.useLeft) {
            this.$outer.addClass('lg-use-left');

            // Set mode lg-slide if use left is true;
            this.s.mode = 'lg-slide';
        } else {
            this.$outer.addClass('lg-use-css3');
        }

        // For fixed height gallery
        _this.setTop();
        $(window).on('resize.lg orientationchange.lg', function() {
            setTimeout(function() {
                _this.setTop();
            }, 100);
        });

        // add class lg-current to remove initial transition
        this.$slide.eq(this.index).addClass('lg-current');

        // add Class for css support and transition mode
        if (this.doCss()) {
            this.$outer.addClass('lg-css3');
        } else {
            this.$outer.addClass('lg-css');

            // Set speed 0 because no animation will happen if browser doesn't support css3
            this.s.speed = 0;
        }

        this.$outer.addClass(this.s.mode);

        if (this.s.enableDrag && this.$items.length > 1) {
            this.$outer.addClass('lg-grab');
        }

        if (this.s.showAfterLoad) {
            this.$outer.addClass('lg-show-after-load');
        }

        if (this.doCss()) {
            var $inner = this.$outer.find('.lg-inner');
            $inner.css('transition-timing-function', this.s.cssEasing);
            $inner.css('transition-duration', this.s.speed + 'ms');
        }

        $('.lg-backdrop').addClass('in');

        setTimeout(function() {
            _this.$outer.addClass('lg-visible');
        }, this.s.backdropDuration);

        if (this.s.download) {
            this.$outer.find('.lg-toolbar').append('<a id="lg-download" target="_blank" download class="lg-download lg-icon"></a>');
        }

        // Store the current scroll top value to scroll back after closing the gallery..
        this.prevScrollTop = $(window).scrollTop();

    };

    // For fixed height gallery
    Plugin.prototype.setTop = function() {
        if (this.s.height !== '100%') {
            var wH = $(window).height();
            var top = (wH - parseInt(this.s.height, 10)) / 2;
            var $lGallery = this.$outer.find('.lg');
            if (wH >= parseInt(this.s.height, 10)) {
                $lGallery.css('top', top + 'px');
            } else {
                $lGallery.css('top', '0px');
            }
        }
    };

    // Find css3 support
    Plugin.prototype.doCss = function() {
        // check for css animation support
        var support = function() {
            var transition = ['transition', 'MozTransition', 'WebkitTransition', 'OTransition', 'msTransition', 'KhtmlTransition'];
            var root = document.documentElement;
            var i = 0;
            for (i = 0; i < transition.length; i++) {
                if (transition[i] in root.style) {
                    return true;
                }
            }
        };

        if (support()) {
            return true;
        }

        return false;
    };

    /**
     *  @desc Check the given src is video
     *  @param {String} src
     *  @return {Object} video type
     *  Ex:{ youtube  :  ["//www.youtube.com/watch?v=c0asJgSyxcY", "c0asJgSyxcY"] }
     */
    Plugin.prototype.isVideo = function(src, index) {

        var html;
        if (this.s.dynamic) {
            html = this.s.dynamicEl[index].html;
        } else {
            html = this.$items.eq(index).attr('data-html');
        }

        if (!src && html) {
            return {
                html5: true
            };
        }

        var youtube = src.match(/\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|embed\/)?([a-z0-9\-\_\%]+)/i);
        var vimeo = src.match(/\/\/(?:www\.)?vimeo.com\/([0-9a-z\-_]+)/i);
        var dailymotion = src.match(/\/\/(?:www\.)?dai.ly\/([0-9a-z\-_]+)/i);

        if (youtube) {
            return {
                youtube: youtube
            };
        } else if (vimeo) {
            return {
                vimeo: vimeo
            };
        } else if (dailymotion) {
            return {
                dailymotion: dailymotion
            };
        }
    };

    /**
     *  @desc Create image counter
     *  Ex: 1/10
     */
    Plugin.prototype.counter = function() {
        if (this.s.counter) {
            $(this.s.appendCounterTo).append('<div id="lg-counter"><span id="lg-counter-current">' + (parseInt(this.index, 10) + 1) + '</span> / <span id="lg-counter-all">' + this.$items.length + '</span></div>');
        }
    };

    /**
     *  @desc add sub-html into the slide
     *  @param {Number} index - index of the slide
     */
    Plugin.prototype.addHtml = function(index) {
        var subHtml = null;
        var subHtmlUrl;
        if (this.s.dynamic) {
            if (this.s.dynamicEl[index].subHtmlUrl) {
                subHtmlUrl = this.s.dynamicEl[index].subHtmlUrl;
            } else {
                subHtml = this.s.dynamicEl[index].subHtml;
            }
        } else {
            if (this.$items.eq(index).attr('data-sub-html-url')) {
                subHtmlUrl = this.$items.eq(index).attr('data-sub-html-url');
            } else {
                subHtml = this.$items.eq(index).attr('data-sub-html');
            }
        }

        if (!subHtmlUrl) {
            if (typeof subHtml !== 'undefined' && subHtml !== null) {

                // get first letter of subhtml
                // if first letter starts with . or # get the html form the jQuery object
                var fL = subHtml.substring(0, 1);
                if (fL === '.' || fL === '#') {
                    subHtml = $(subHtml).html();
                } else {
                    subHtml = subHtml;
                }
            } else {
                subHtml = '';
            }
        }

        if (this.s.appendSubHtmlTo === '.lg-sub-html') {

            if (subHtmlUrl) {
                this.$outer.find(this.s.appendSubHtmlTo).load(subHtmlUrl);
            } else {
                this.$outer.find(this.s.appendSubHtmlTo).html(subHtml);
            }

        } else {

            if (subHtmlUrl) {
                this.$slide.eq(index).load(subHtmlUrl);
            } else {
                this.$slide.eq(index).append(subHtml);
            }
        }

        // Add lg-empty-html class if title doesn't exist
        if (typeof subHtml !== 'undefined' && subHtml !== null) {
            if (subHtml === '') {
                this.$outer.find(this.s.appendSubHtmlTo).addClass('lg-empty-html');
            } else {
                this.$outer.find(this.s.appendSubHtmlTo).removeClass('lg-empty-html');
            }
        }

        this.$el.trigger('onAfterAppendSubHtml.lg', [index]);
    };

    /**
     *  @desc Preload slides
     *  @param {Number} index - index of the slide
     */
    Plugin.prototype.preload = function(index) {
        var i = 1;
        var j = 1;
        for (i = 1; i <= this.s.preload; i++) {
            if (i >= this.$items.length - index) {
                break;
            }

            this.loadContent(index + i, false, 0);
        }

        for (j = 1; j <= this.s.preload; j++) {
            if (index - j < 0) {
                break;
            }

            this.loadContent(index - j, false, 0);
        }
    };

    /**
     *  @desc Load slide content into slide.
     *  @param {Number} index - index of the slide.
     *  @param {Boolean} rec - if true call loadcontent() function again.
     *  @param {Boolean} delay - delay for adding complete class. it is 0 except first time.
     */
    Plugin.prototype.loadContent = function(index, rec, delay) {

        var _this = this;
        var _hasPoster = false;
        var _$img;
        var _src;
        var _poster;
        var _srcset;
        var _sizes;
        var _html;
        var getResponsiveSrc = function(srcItms) {
            var rsWidth = [];
            var rsSrc = [];
            for (var i = 0; i < srcItms.length; i++) {
                var __src = srcItms[i].split(' ');

                // Manage empty space
                if (__src[0] === '') {
                    __src.splice(0, 1);
                }

                rsSrc.push(__src[0]);
                rsWidth.push(__src[1]);
            }

            var wWidth = $(window).width();
            for (var j = 0; j < rsWidth.length; j++) {
                if (parseInt(rsWidth[j], 10) > wWidth) {
                    _src = rsSrc[j];
                    break;
                }
            }
        };

        if (_this.s.dynamic) {

            if (_this.s.dynamicEl[index].poster) {
                _hasPoster = true;
                _poster = _this.s.dynamicEl[index].poster;
            }

            _html = _this.s.dynamicEl[index].html;
            _src = _this.s.dynamicEl[index].src;

            if (_this.s.dynamicEl[index].responsive) {
                var srcDyItms = _this.s.dynamicEl[index].responsive.split(',');
                getResponsiveSrc(srcDyItms);
            }

            _srcset = _this.s.dynamicEl[index].srcset;
            _sizes = _this.s.dynamicEl[index].sizes;

        } else {

            if (_this.$items.eq(index).attr('data-poster')) {
                _hasPoster = true;
                _poster = _this.$items.eq(index).attr('data-poster');
            }

            _html = _this.$items.eq(index).attr('data-html');
            _src = _this.$items.eq(index).attr('href') || _this.$items.eq(index).attr('data-src');

            if (_this.$items.eq(index).attr('data-responsive')) {
                var srcItms = _this.$items.eq(index).attr('data-responsive').split(',');
                getResponsiveSrc(srcItms);
            }

            _srcset = _this.$items.eq(index).attr('data-srcset');
            _sizes = _this.$items.eq(index).attr('data-sizes');

        }

        //if (_src || _srcset || _sizes || _poster) {

        var iframe = false;
        if (_this.s.dynamic) {
            if (_this.s.dynamicEl[index].iframe) {
                iframe = true;
            }
        } else {
            if (_this.$items.eq(index).attr('data-iframe') === 'true') {
                iframe = true;
            }
        }

        var _isVideo = _this.isVideo(_src, index);
        if (!_this.$slide.eq(index).hasClass('lg-loaded')) {
            if (iframe) {
                _this.$slide.eq(index).prepend('<div class="lg-video-cont" style="max-width:' + _this.s.iframeMaxWidth + '"><div class="lg-video"><iframe class="lg-object" frameborder="0" src="' + _src + '"  allowfullscreen="true"></iframe></div></div>');
            } else if (_hasPoster) {
                var videoClass = '';
                if (_isVideo && _isVideo.youtube) {
                    videoClass = 'lg-has-youtube';
                } else if (_isVideo && _isVideo.vimeo) {
                    videoClass = 'lg-has-vimeo';
                } else {
                    videoClass = 'lg-has-html5';
                }

                _this.$slide.eq(index).prepend('<div class="lg-video-cont ' + videoClass + ' "><div class="lg-video"><span class="lg-video-play"></span><img class="lg-object lg-has-poster" src="' + _poster + '" /></div></div>');

            } else if (_isVideo) {
                _this.$slide.eq(index).prepend('<div class="lg-video-cont "><div class="lg-video"></div></div>');
                _this.$el.trigger('hasVideo.lg', [index, _src, _html]);
            } else {
                _this.$slide.eq(index).prepend('<div class="lg-img-wrap"><img class="lg-object lg-image" src="' + _src + '" /></div>');
            }

            _this.$el.trigger('onAferAppendSlide.lg', [index]);

            _$img = _this.$slide.eq(index).find('.lg-object');
            if (_sizes) {
                _$img.attr('sizes', _sizes);
            }

            if (_srcset) {
                _$img.attr('srcset', _srcset);
                try {
                    picturefill({
                        elements: [_$img[0]]
                    });
                } catch (e) {
                    console.error('Make sure you have included Picturefill version 2');
                }
            }

            if (this.s.appendSubHtmlTo !== '.lg-sub-html') {
                _this.addHtml(index);
            }

            _this.$slide.eq(index).addClass('lg-loaded');
        }

        _this.$slide.eq(index).find('.lg-object').on('load.lg error.lg', function() {

            // For first time add some delay for displaying the start animation.
            var _speed = 0;

            // Do not change the delay value because it is required for zoom plugin.
            // If gallery opened from direct url (hash) speed value should be 0
            if (delay && !$('body').hasClass('lg-from-hash')) {
                _speed = delay;
            }

            setTimeout(function() {
                _this.$slide.eq(index).addClass('lg-complete');
                _this.$el.trigger('onSlideItemLoad.lg', [index, delay || 0]);
            }, _speed);

        });

        // @todo check load state for html5 videos
        if (_isVideo && _isVideo.html5 && !_hasPoster) {
            _this.$slide.eq(index).addClass('lg-complete');
        }

        if (rec === true) {
            if (!_this.$slide.eq(index).hasClass('lg-complete')) {
                _this.$slide.eq(index).find('.lg-object').on('load.lg error.lg', function() {
                    _this.preload(index);
                });
            } else {
                _this.preload(index);
            }
        }

        //}
    };

    /**
    *   @desc slide function for lightgallery
        ** Slide() gets call on start
        ** ** Set lg.on true once slide() function gets called.
        ** Call loadContent() on slide() function inside setTimeout
        ** ** On first slide we do not want any animation like slide of fade
        ** ** So on first slide( if lg.on if false that is first slide) loadContent() should start loading immediately
        ** ** Else loadContent() should wait for the transition to complete.
        ** ** So set timeout s.speed + 50
    <=> ** loadContent() will load slide content in to the particular slide
        ** ** It has recursion (rec) parameter. if rec === true loadContent() will call preload() function.
        ** ** preload will execute only when the previous slide is fully loaded (images iframe)
        ** ** avoid simultaneous image load
    <=> ** Preload() will check for s.preload value and call loadContent() again accoring to preload value
        ** loadContent()  <====> Preload();

    *   @param {Number} index - index of the slide
    *   @param {Boolean} fromTouch - true if slide function called via touch event or mouse drag
    *   @param {Boolean} fromThumb - true if slide function called via thumbnail click
    */
    Plugin.prototype.slide = function(index, fromTouch, fromThumb) {

        var _prevIndex = this.$outer.find('.lg-current').index();
        var _this = this;

        // Prevent if multiple call
        // Required for hsh plugin
        if (_this.lGalleryOn && (_prevIndex === index)) {
            return;
        }

        var _length = this.$slide.length;
        var _time = _this.lGalleryOn ? this.s.speed : 0;
        var _next = false;
        var _prev = false;

        if (!_this.lgBusy) {

            if (this.s.download) {
                var _src;
                if (_this.s.dynamic) {
                    _src = _this.s.dynamicEl[index].downloadUrl !== false && (_this.s.dynamicEl[index].downloadUrl || _this.s.dynamicEl[index].src);
                } else {
                    _src = _this.$items.eq(index).attr('data-download-url') !== 'false' && (_this.$items.eq(index).attr('data-download-url') || _this.$items.eq(index).attr('href') || _this.$items.eq(index).attr('data-src'));

                }

                if (_src) {
                    $('#lg-download').attr('href', _src);
                    _this.$outer.removeClass('lg-hide-download');
                } else {
                    _this.$outer.addClass('lg-hide-download');
                }
            }

            this.$el.trigger('onBeforeSlide.lg', [_prevIndex, index, fromTouch, fromThumb]);

            _this.lgBusy = true;

            clearTimeout(_this.hideBartimeout);

            // Add title if this.s.appendSubHtmlTo === lg-sub-html
            if (this.s.appendSubHtmlTo === '.lg-sub-html') {

                // wait for slide animation to complete
                setTimeout(function() {
                    _this.addHtml(index);
                }, _time);
            }

            this.arrowDisable(index);

            if (!fromTouch) {

                // remove all transitions
                _this.$outer.addClass('lg-no-trans');

                this.$slide.removeClass('lg-prev-slide lg-next-slide');

                if (index < _prevIndex) {
                    _prev = true;
                    if ((index === 0) && (_prevIndex === _length - 1) && !fromThumb) {
                        _prev = false;
                        _next = true;
                    }
                } else if (index > _prevIndex) {
                    _next = true;
                    if ((index === _length - 1) && (_prevIndex === 0) && !fromThumb) {
                        _prev = true;
                        _next = false;
                    }
                }

                if (_prev) {

                    //prevslide
                    this.$slide.eq(index).addClass('lg-prev-slide');
                    this.$slide.eq(_prevIndex).addClass('lg-next-slide');
                } else if (_next) {

                    // next slide
                    this.$slide.eq(index).addClass('lg-next-slide');
                    this.$slide.eq(_prevIndex).addClass('lg-prev-slide');
                }

                // give 50 ms for browser to add/remove class
                setTimeout(function() {
                    _this.$slide.removeClass('lg-current');

                    //_this.$slide.eq(_prevIndex).removeClass('lg-current');
                    _this.$slide.eq(index).addClass('lg-current');

                    // reset all transitions
                    _this.$outer.removeClass('lg-no-trans');
                }, 50);
            } else {

                var touchPrev = index - 1;
                var touchNext = index + 1;

                if ((index === 0) && (_prevIndex === _length - 1)) {

                    // next slide
                    touchNext = 0;
                    touchPrev = _length - 1;
                } else if ((index === _length - 1) && (_prevIndex === 0)) {

                    // prev slide
                    touchNext = 0;
                    touchPrev = _length - 1;
                }

                this.$slide.removeClass('lg-prev-slide lg-current lg-next-slide');
                _this.$slide.eq(touchPrev).addClass('lg-prev-slide');
                _this.$slide.eq(touchNext).addClass('lg-next-slide');
                _this.$slide.eq(index).addClass('lg-current');
            }

            if (_this.lGalleryOn) {
                setTimeout(function() {
                    _this.loadContent(index, true, 0);
                }, this.s.speed + 50);

                setTimeout(function() {
                    _this.lgBusy = false;
                    _this.$el.trigger('onAfterSlide.lg', [_prevIndex, index, fromTouch, fromThumb]);
                }, this.s.speed);

            } else {
                _this.loadContent(index, true, _this.s.backdropDuration);

                _this.lgBusy = false;
                _this.$el.trigger('onAfterSlide.lg', [_prevIndex, index, fromTouch, fromThumb]);
            }

            _this.lGalleryOn = true;

            if (this.s.counter) {
                $('#lg-counter-current').text(index + 1);
            }

        }

    };

    /**
     *  @desc Go to next slide
     *  @param {Boolean} fromTouch - true if slide function called via touch event
     */
    Plugin.prototype.goToNextSlide = function(fromTouch) {
        var _this = this;
        if (!_this.lgBusy) {
            if ((_this.index + 1) < _this.$slide.length) {
                _this.index++;
                _this.$el.trigger('onBeforeNextSlide.lg', [_this.index]);
                _this.slide(_this.index, fromTouch, false);
            } else {
                if (_this.s.loop) {
                    _this.index = 0;
                    _this.$el.trigger('onBeforeNextSlide.lg', [_this.index]);
                    _this.slide(_this.index, fromTouch, false);
                } else if (_this.s.slideEndAnimatoin) {
                    _this.$outer.addClass('lg-right-end');
                    setTimeout(function() {
                        _this.$outer.removeClass('lg-right-end');
                    }, 400);
                }
            }
        }
    };

    /**
     *  @desc Go to previous slide
     *  @param {Boolean} fromTouch - true if slide function called via touch event
     */
    Plugin.prototype.goToPrevSlide = function(fromTouch) {
        var _this = this;
        if (!_this.lgBusy) {
            if (_this.index > 0) {
                _this.index--;
                _this.$el.trigger('onBeforePrevSlide.lg', [_this.index, fromTouch]);
                _this.slide(_this.index, fromTouch, false);
            } else {
                if (_this.s.loop) {
                    _this.index = _this.$items.length - 1;
                    _this.$el.trigger('onBeforePrevSlide.lg', [_this.index, fromTouch]);
                    _this.slide(_this.index, fromTouch, false);
                } else if (_this.s.slideEndAnimatoin) {
                    _this.$outer.addClass('lg-left-end');
                    setTimeout(function() {
                        _this.$outer.removeClass('lg-left-end');
                    }, 400);
                }
            }
        }
    };

    Plugin.prototype.keyPress = function() {
        var _this = this;
        if (this.$items.length > 1) {
            $(window).on('keyup.lg', function(e) {
                if (_this.$items.length > 1) {
                    if (e.keyCode === 37) {
                        e.preventDefault();
                        _this.goToPrevSlide();
                    }

                    if (e.keyCode === 39) {
                        e.preventDefault();
                        _this.goToNextSlide();
                    }
                }
            });
        }

        $(window).on('keydown.lg', function(e) {
            if (_this.s.escKey === true && e.keyCode === 27) {
                e.preventDefault();
                if (!_this.$outer.hasClass('lg-thumb-open')) {
                    _this.destroy();
                } else {
                    _this.$outer.removeClass('lg-thumb-open');
                }
            }
        });
    };

    Plugin.prototype.arrow = function() {
        var _this = this;
        this.$outer.find('.lg-prev').on('click.lg', function() {
            _this.goToPrevSlide();
        });

        this.$outer.find('.lg-next').on('click.lg', function() {
            _this.goToNextSlide();
        });
    };

    Plugin.prototype.arrowDisable = function(index) {

        // Disable arrows if s.hideControlOnEnd is true
        if (!this.s.loop && this.s.hideControlOnEnd) {
            if ((index + 1) < this.$slide.length) {
                this.$outer.find('.lg-next').removeAttr('disabled').removeClass('disabled');
            } else {
                this.$outer.find('.lg-next').attr('disabled', 'disabled').addClass('disabled');
            }

            if (index > 0) {
                this.$outer.find('.lg-prev').removeAttr('disabled').removeClass('disabled');
            } else {
                this.$outer.find('.lg-prev').attr('disabled', 'disabled').addClass('disabled');
            }
        }
    };

    Plugin.prototype.setTranslate = function($el, xValue, yValue) {
        // jQuery supports Automatic CSS prefixing since jQuery 1.8.0
        if (this.s.useLeft) {
            $el.css('left', xValue);
        } else {
            $el.css({
                transform: 'translate3d(' + (xValue) + 'px, ' + yValue + 'px, 0px)'
            });
        }
    };

    Plugin.prototype.touchMove = function(startCoords, endCoords) {

        var distance = endCoords - startCoords;

        if (Math.abs(distance) > 15) {
            // reset opacity and transition duration
            this.$outer.addClass('lg-dragging');

            // move current slide
            this.setTranslate(this.$slide.eq(this.index), distance, 0);

            // move next and prev slide with current slide
            this.setTranslate($('.lg-prev-slide'), -this.$slide.eq(this.index).width() + distance, 0);
            this.setTranslate($('.lg-next-slide'), this.$slide.eq(this.index).width() + distance, 0);
        }
    };

    Plugin.prototype.touchEnd = function(distance) {
        var _this = this;

        // keep slide animation for any mode while dragg/swipe
        if (_this.s.mode !== 'lg-slide') {
            _this.$outer.addClass('lg-slide');
        }

        this.$slide.not('.lg-current, .lg-prev-slide, .lg-next-slide').css('opacity', '0');

        // set transition duration
        setTimeout(function() {
            _this.$outer.removeClass('lg-dragging');
            if ((distance < 0) && (Math.abs(distance) > _this.s.swipeThreshold)) {
                _this.goToNextSlide(true);
            } else if ((distance > 0) && (Math.abs(distance) > _this.s.swipeThreshold)) {
                _this.goToPrevSlide(true);
            } else if (Math.abs(distance) < 5) {

                // Trigger click if distance is less than 5 pix
                _this.$el.trigger('onSlideClick.lg');
            }

            _this.$slide.removeAttr('style');
        });

        // remove slide class once drag/swipe is completed if mode is not slide
        setTimeout(function() {
            if (!_this.$outer.hasClass('lg-dragging') && _this.s.mode !== 'lg-slide') {
                _this.$outer.removeClass('lg-slide');
            }
        }, _this.s.speed + 100);

    };

    Plugin.prototype.enableSwipe = function() {
        var _this = this;
        var startCoords = 0;
        var endCoords = 0;
        var isMoved = false;

        if (_this.s.enableSwipe && _this.isTouch && _this.doCss()) {

            _this.$slide.on('touchstart.lg', function(e) {
                if (!_this.$outer.hasClass('lg-zoomed') && !_this.lgBusy) {
                    e.preventDefault();
                    _this.manageSwipeClass();
                    startCoords = e.originalEvent.targetTouches[0].pageX;
                }
            });

            _this.$slide.on('touchmove.lg', function(e) {
                if (!_this.$outer.hasClass('lg-zoomed')) {
                    e.preventDefault();
                    endCoords = e.originalEvent.targetTouches[0].pageX;
                    _this.touchMove(startCoords, endCoords);
                    isMoved = true;
                }
            });

            _this.$slide.on('touchend.lg', function() {
                if (!_this.$outer.hasClass('lg-zoomed')) {
                    if (isMoved) {
                        isMoved = false;
                        _this.touchEnd(endCoords - startCoords);
                    } else {
                        _this.$el.trigger('onSlideClick.lg');
                    }
                }
            });
        }

    };

    Plugin.prototype.enableDrag = function() {
        var _this = this;
        var startCoords = 0;
        var endCoords = 0;
        var isDraging = false;
        var isMoved = false;
        if (_this.s.enableDrag && !_this.isTouch && _this.doCss()) {
            _this.$slide.on('mousedown.lg', function(e) {
                // execute only on .lg-object
                if (!_this.$outer.hasClass('lg-zoomed')) {
                    if ($(e.target).hasClass('lg-object') || $(e.target).hasClass('lg-video-play')) {
                        e.preventDefault();

                        if (!_this.lgBusy) {
                            _this.manageSwipeClass();
                            startCoords = e.pageX;
                            isDraging = true;

                            // ** Fix for webkit cursor issue https://code.google.com/p/chromium/issues/detail?id=26723
                            _this.$outer.scrollLeft += 1;
                            _this.$outer.scrollLeft -= 1;

                            // *

                            _this.$outer.removeClass('lg-grab').addClass('lg-grabbing');

                            _this.$el.trigger('onDragstart.lg');
                        }

                    }
                }
            });

            $(window).on('mousemove.lg', function(e) {
                if (isDraging) {
                    isMoved = true;
                    endCoords = e.pageX;
                    _this.touchMove(startCoords, endCoords);
                    _this.$el.trigger('onDragmove.lg');
                }
            });

            $(window).on('mouseup.lg', function(e) {
                if (isMoved) {
                    isMoved = false;
                    _this.touchEnd(endCoords - startCoords);
                    _this.$el.trigger('onDragend.lg');
                } else if ($(e.target).hasClass('lg-object') || $(e.target).hasClass('lg-video-play')) {
                    _this.$el.trigger('onSlideClick.lg');
                }

                // Prevent execution on click
                if (isDraging) {
                    isDraging = false;
                    _this.$outer.removeClass('lg-grabbing').addClass('lg-grab');
                }
            });

        }
    };

    Plugin.prototype.manageSwipeClass = function() {
        var touchNext = this.index + 1;
        var touchPrev = this.index - 1;
        var length = this.$slide.length;
        if (this.s.loop) {
            if (this.index === 0) {
                touchPrev = length - 1;
            } else if (this.index === length - 1) {
                touchNext = 0;
            }
        }

        this.$slide.removeClass('lg-next-slide lg-prev-slide');
        if (touchPrev > -1) {
            this.$slide.eq(touchPrev).addClass('lg-prev-slide');
        }

        this.$slide.eq(touchNext).addClass('lg-next-slide');
    };

    Plugin.prototype.mousewheel = function() {
        var _this = this;
        _this.$outer.on('mousewheel.lg', function(e) {

            if (!e.deltaY) {
                return;
            }

            if (e.deltaY > 0) {
                _this.goToPrevSlide();
            } else {
                _this.goToNextSlide();
            }

            e.preventDefault();
        });

    };

    Plugin.prototype.closeGallery = function() {

        var _this = this;
        var mousedown = false;
        this.$outer.find('.lg-close').on('click.lg', function() {
            _this.destroy();
        });

        if (_this.s.closable) {

            // If you drag the slide and release outside gallery gets close on chrome
            // for preventing this check mousedown and mouseup happened on .lg-item or lg-outer
            _this.$outer.on('mousedown.lg', function(e) {

                if ($(e.target).is('.lg-outer') || $(e.target).is('.lg-item ') || $(e.target).is('.lg-img-wrap')) {
                    mousedown = true;
                } else {
                    mousedown = false;
                }

            });

            _this.$outer.on('mouseup.lg', function(e) {

                if ($(e.target).is('.lg-outer') || $(e.target).is('.lg-item ') || $(e.target).is('.lg-img-wrap') && mousedown) {
                    if (!_this.$outer.hasClass('lg-dragging')) {
                        _this.destroy();
                    }
                }

            });

        }

    };

    Plugin.prototype.destroy = function(d) {

        var _this = this;

        if (!d) {
            _this.$el.trigger('onBeforeClose.lg');
        }

        $(window).scrollTop(_this.prevScrollTop);

        /**
         * if d is false or undefined destroy will only close the gallery
         * plugins instance remains with the element
         *
         * if d is true destroy will completely remove the plugin
         */

        if (d) {
            if (!_this.s.dynamic) {
                // only when not using dynamic mode is $items a jquery collection
                this.$items.off('click.lg click.lgcustom');
            }

            $.removeData(_this.el, 'lightGallery');
        }

        // Unbind all events added by lightGallery
        this.$el.off('.lg.tm');

        // Distroy all lightGallery modules
        $.each($.fn.lightGallery.modules, function(key) {
            if (_this.modules[key]) {
                _this.modules[key].destroy();
            }
        });

        this.lGalleryOn = false;

        clearTimeout(_this.hideBartimeout);
        this.hideBartimeout = false;
        $(window).off('.lg');
        $('body').removeClass('lg-on lg-from-hash');

        if (_this.$outer) {
            _this.$outer.removeClass('lg-visible');
        }

        $('.lg-backdrop').removeClass('in');

        setTimeout(function() {
            if (_this.$outer) {
                _this.$outer.remove();
            }

            $('.lg-backdrop').remove();

            if (!d) {
                _this.$el.trigger('onCloseAfter.lg');
            }

        }, _this.s.backdropDuration + 50);
    };

    $.fn.lightGallery = function(options) {
        return this.each(function() {
            if (!$.data(this, 'lightGallery')) {
                $.data(this, 'lightGallery', new Plugin(this, options));
            } else {
                try {
                    $(this).data('lightGallery').init();
                } catch (err) {
                    console.error('lightGallery has not initiated properly');
                }
            }
        });
    };

    $.fn.lightGallery.modules = {};

})(jQuery, window, document);


////// THUMBNAIL PLUGIN

(function($, window, document, undefined) {

    'use strict';

    var defaults = {
        thumbnail: true,

        animateThumb: true,
        currentPagerPosition: 'middle',

        thumbWidth: 100,
        thumbContHeight: 100,
        thumbMargin: 5,

        exThumbImage: false,
        showThumbByDefault: true,
        toogleThumb: true,
        pullCaptionUp: true,

        enableThumbDrag: true,
        enableThumbSwipe: true,
        swipeThreshold: 50,

        loadYoutubeThumbnail: true,
        youtubeThumbSize: 1,

        loadVimeoThumbnail: true,
        vimeoThumbSize: 'thumbnail_small',

        loadDailymotionThumbnail: true
    };

    var Thumbnail = function(element) {

        // get lightGallery core plugin data
        this.core = $(element).data('lightGallery');

        // extend module default settings with lightGallery core settings
        this.core.s = $.extend({}, defaults, this.core.s);

        this.$el = $(element);
        this.$thumbOuter = null;
        this.thumbOuterWidth = 0;
        this.thumbTotalWidth = (this.core.$items.length * (this.core.s.thumbWidth + this.core.s.thumbMargin));
        this.thumbIndex = this.core.index;

        // Thumbnail animation value
        this.left = 0;

        this.init();

        return this;
    };

    Thumbnail.prototype.init = function() {
        var _this = this;
        if (this.core.s.thumbnail && this.core.$items.length > 1) {
            if (this.core.s.showThumbByDefault) {
                setTimeout(function(){
                    _this.core.$outer.addClass('lg-thumb-open');
                }, 700);
            }

            if (this.core.s.pullCaptionUp) {
                this.core.$outer.addClass('lg-pull-caption-up');
            }

            this.build();
            if (this.core.s.animateThumb) {
                if (this.core.s.enableThumbDrag && !this.core.isTouch && this.core.doCss()) {
                    this.enableThumbDrag();
                }

                if (this.core.s.enableThumbSwipe && this.core.isTouch && this.core.doCss()) {
                    this.enableThumbSwipe();
                }

                this.thumbClickable = false;
            } else {
                this.thumbClickable = true;
            }

            this.toogle();
            this.thumbkeyPress();
        }
    };

    Thumbnail.prototype.build = function() {
        var _this = this;
        var thumbList = '';
        var vimeoErrorThumbSize = '';
        var $thumb;
        var html = '<div class="lg-thumb-outer">' +
            '<div class="lg-thumb group">' +
            '</div>' +
            '</div>';

        switch (this.core.s.vimeoThumbSize) {
            case 'thumbnail_large':
                vimeoErrorThumbSize = '640';
                break;
            case 'thumbnail_medium':
                vimeoErrorThumbSize = '200x150';
                break;
            case 'thumbnail_small':
                vimeoErrorThumbSize = '100x75';
        }

        _this.core.$outer.addClass('lg-has-thumb');

        _this.core.$outer.find('.lg').append(html);

        _this.$thumbOuter = _this.core.$outer.find('.lg-thumb-outer');
        _this.thumbOuterWidth = _this.$thumbOuter.width();

        if (_this.core.s.animateThumb) {
            _this.core.$outer.find('.lg-thumb').css({
                width: _this.thumbTotalWidth + 'px',
                position: 'relative'
            });
        }

        if (this.core.s.animateThumb) {
            _this.$thumbOuter.css('height', _this.core.s.thumbContHeight + 'px');
        }

        function getThumb(src, thumb, index) {
            var isVideo = _this.core.isVideo(src, index) || {};
            var thumbImg;
            var vimeoId = '';

            if (isVideo.youtube || isVideo.vimeo || isVideo.dailymotion) {
                if (isVideo.youtube) {
                    if (_this.core.s.loadYoutubeThumbnail) {
                        thumbImg = '//img.youtube.com/vi/' + isVideo.youtube[1] + '/' + _this.core.s.youtubeThumbSize + '.jpg';
                    } else {
                        thumbImg = thumb;
                    }
                } else if (isVideo.vimeo) {
                    if (_this.core.s.loadVimeoThumbnail) {
                        thumbImg = '//i.vimeocdn.com/video/error_' + vimeoErrorThumbSize + '.jpg';
                        vimeoId = isVideo.vimeo[1];
                    } else {
                        thumbImg = thumb;
                    }
                } else if (isVideo.dailymotion) {
                    if (_this.core.s.loadDailymotionThumbnail) {
                        thumbImg = '//www.dailymotion.com/thumbnail/video/' + isVideo.dailymotion[1];
                    } else {
                        thumbImg = thumb;
                    }
                }
            } else {
                thumbImg = thumb;
            }

            thumbList += '<div data-vimeo-id="' + vimeoId + '" class="lg-thumb-item" style="width:' + _this.core.s.thumbWidth + 'px; margin-right: ' + _this.core.s.thumbMargin + 'px"><img src="' + thumbImg + '" /></div>';
            vimeoId = '';
        }

        if (_this.core.s.dynamic) {
            for (var i = 0; i < _this.core.s.dynamicEl.length; i++) {
                getThumb(_this.core.s.dynamicEl[i].src, _this.core.s.dynamicEl[i].thumb, i);
            }
        } else {
            _this.core.$items.each(function(i) {

                if (!_this.core.s.exThumbImage) {
                    getThumb($(this).attr('href') || $(this).attr('data-src'), $(this).find('img').attr('src'), i);
                } else {
                    getThumb($(this).attr('href') || $(this).attr('data-src'), $(this).attr(_this.core.s.exThumbImage), i);
                }

            });
        }

        _this.core.$outer.find('.lg-thumb').html(thumbList);

        $thumb = _this.core.$outer.find('.lg-thumb-item');

        // Load vimeo thumbnails
        $thumb.each(function() {
            var $this = $(this);
            var vimeoVideoId = $this.attr('data-vimeo-id');

            if (vimeoVideoId) {
                $.getJSON('//www.vimeo.com/api/v2/video/' + vimeoVideoId + '.json?callback=?', {
                    format: 'json'
                }, function(data) {
                    $this.find('img').attr('src', data[0][_this.core.s.vimeoThumbSize]);
                });
            }
        });

        // manage active class for thumbnail
        $thumb.eq(_this.core.index).addClass('active');
        _this.core.$el.on('onBeforeSlide.lg.tm', function() {
            $thumb.removeClass('active');
            $thumb.eq(_this.core.index).addClass('active');
        });

        $thumb.on('click.lg touchend.lg', function() {
            var _$this = $(this);
            setTimeout(function() {

                // In IE9 and bellow touch does not support
                // Go to slide if browser does not support css transitions
                if ((_this.thumbClickable && !_this.core.lgBusy) || !_this.core.doCss()) {
                    _this.core.index = _$this.index();
                    _this.core.slide(_this.core.index, false, true);
                }
            }, 50);
        });

        _this.core.$el.on('onBeforeSlide.lg.tm', function() {
            _this.animateThumb(_this.core.index);
        });

        $(window).on('resize.lg.thumb orientationchange.lg.thumb', function() {
            setTimeout(function() {
                _this.animateThumb(_this.core.index);
                _this.thumbOuterWidth = _this.$thumbOuter.width();
            }, 200);
        });

    };

    Thumbnail.prototype.setTranslate = function(value) {
        // jQuery supports Automatic CSS prefixing since jQuery 1.8.0
        this.core.$outer.find('.lg-thumb').css({
            transform: 'translate3d(-' + (value) + 'px, 0px, 0px)'
        });
    };

    Thumbnail.prototype.animateThumb = function(index) {
        var $thumb = this.core.$outer.find('.lg-thumb');
        if (this.core.s.animateThumb) {
            var position;
            switch (this.core.s.currentPagerPosition) {
                case 'left':
                    position = 0;
                    break;
                case 'middle':
                    position = (this.thumbOuterWidth / 2) - (this.core.s.thumbWidth / 2);
                    break;
                case 'right':
                    position = this.thumbOuterWidth - this.core.s.thumbWidth;
            }
            this.left = ((this.core.s.thumbWidth + this.core.s.thumbMargin) * index - 1) - position;
            if (this.left > (this.thumbTotalWidth - this.thumbOuterWidth)) {
                this.left = this.thumbTotalWidth - this.thumbOuterWidth;
            }

            if (this.left < 0) {
                this.left = 0;
            }

            if (this.core.lGalleryOn) {
                if (!$thumb.hasClass('on')) {
                    this.core.$outer.find('.lg-thumb').css('transition-duration', this.core.s.speed + 'ms');
                }

                if (!this.core.doCss()) {
                    $thumb.animate({
                        left: -this.left + 'px'
                    }, this.core.s.speed);
                }
            } else {
                if (!this.core.doCss()) {
                    $thumb.css('left', -this.left + 'px');
                }
            }

            this.setTranslate(this.left);

        }
    };

    // Enable thumbnail dragging and swiping
    Thumbnail.prototype.enableThumbDrag = function() {

        var _this = this;
        var startCoords = 0;
        var endCoords = 0;
        var isDraging = false;
        var isMoved = false;
        var tempLeft = 0;

        _this.$thumbOuter.addClass('lg-grab');

        _this.core.$outer.find('.lg-thumb').on('mousedown.lg.thumb', function(e) {
            if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
                // execute only on .lg-object
                e.preventDefault();
                startCoords = e.pageX;
                isDraging = true;

                // ** Fix for webkit cursor issue https://code.google.com/p/chromium/issues/detail?id=26723
                _this.core.$outer.scrollLeft += 1;
                _this.core.$outer.scrollLeft -= 1;

                // *
                _this.thumbClickable = false;
                _this.$thumbOuter.removeClass('lg-grab').addClass('lg-grabbing');
            }
        });

        $(window).on('mousemove.lg.thumb', function(e) {
            if (isDraging) {
                tempLeft = _this.left;
                isMoved = true;
                endCoords = e.pageX;

                _this.$thumbOuter.addClass('lg-dragging');

                tempLeft = tempLeft - (endCoords - startCoords);

                if (tempLeft > (_this.thumbTotalWidth - _this.thumbOuterWidth)) {
                    tempLeft = _this.thumbTotalWidth - _this.thumbOuterWidth;
                }

                if (tempLeft < 0) {
                    tempLeft = 0;
                }

                // move current slide
                _this.setTranslate(tempLeft);

            }
        });

        $(window).on('mouseup.lg.thumb', function() {
            if (isMoved) {
                isMoved = false;
                _this.$thumbOuter.removeClass('lg-dragging');

                _this.left = tempLeft;

                if (Math.abs(endCoords - startCoords) < _this.core.s.swipeThreshold) {
                    _this.thumbClickable = true;
                }

            } else {
                _this.thumbClickable = true;
            }

            if (isDraging) {
                isDraging = false;
                _this.$thumbOuter.removeClass('lg-grabbing').addClass('lg-grab');
            }
        });

    };

    Thumbnail.prototype.enableThumbSwipe = function() {
        var _this = this;
        var startCoords = 0;
        var endCoords = 0;
        var isMoved = false;
        var tempLeft = 0;

        _this.core.$outer.find('.lg-thumb').on('touchstart.lg', function(e) {
            if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
                e.preventDefault();
                startCoords = e.originalEvent.targetTouches[0].pageX;
                _this.thumbClickable = false;
            }
        });

        _this.core.$outer.find('.lg-thumb').on('touchmove.lg', function(e) {
            if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
                e.preventDefault();
                endCoords = e.originalEvent.targetTouches[0].pageX;
                isMoved = true;

                _this.$thumbOuter.addClass('lg-dragging');

                tempLeft = _this.left;

                tempLeft = tempLeft - (endCoords - startCoords);

                if (tempLeft > (_this.thumbTotalWidth - _this.thumbOuterWidth)) {
                    tempLeft = _this.thumbTotalWidth - _this.thumbOuterWidth;
                }

                if (tempLeft < 0) {
                    tempLeft = 0;
                }

                // move current slide
                _this.setTranslate(tempLeft);

            }
        });

        _this.core.$outer.find('.lg-thumb').on('touchend.lg', function() {
            if (_this.thumbTotalWidth > _this.thumbOuterWidth) {

                if (isMoved) {
                    isMoved = false;
                    _this.$thumbOuter.removeClass('lg-dragging');
                    if (Math.abs(endCoords - startCoords) < _this.core.s.swipeThreshold) {
                        _this.thumbClickable = true;
                    }

                    _this.left = tempLeft;
                } else {
                    _this.thumbClickable = true;
                }
            } else {
                _this.thumbClickable = true;
            }
        });

    };

    Thumbnail.prototype.toogle = function() {
        var _this = this;
        if (_this.core.s.toogleThumb) {
            _this.core.$outer.addClass('lg-can-toggle');
            _this.$thumbOuter.append('<span class="lg-toogle-thumb lg-icon"></span>');
            _this.core.$outer.find('.lg-toogle-thumb').on('click.lg', function() {
                _this.core.$outer.toggleClass('lg-thumb-open');
            });
        }
    };

    Thumbnail.prototype.thumbkeyPress = function() {
        var _this = this;
        $(window).on('keydown.lg.thumb', function(e) {
            if (e.keyCode === 38) {
                e.preventDefault();
                _this.core.$outer.addClass('lg-thumb-open');
            } else if (e.keyCode === 40) {
                e.preventDefault();
                _this.core.$outer.removeClass('lg-thumb-open');
            }
        });
    };

    Thumbnail.prototype.destroy = function() {
        if (this.core.s.thumbnail && this.core.$items.length > 1) {
            $(window).off('resize.lg.thumb orientationchange.lg.thumb keydown.lg.thumb');
            this.$thumbOuter.remove();
            this.core.$outer.removeClass('lg-has-thumb');
        }
    };

    $.fn.lightGallery.modules.Thumbnail = Thumbnail;

})(jQuery, window, document);

//////////////////////////////////////

var viewModel = function() {
    var self = this;
    self.infoWindow = new google.maps.InfoWindow();
    self.wikiArticles = ko.observableArray();
    self.flickrPics = ko.observableArray();
    self.filter = ko.observable('');
    self.currentCityCountry = ko.observable();
    self.currentCity = ko.observable();
    self.currentLocationData = ko.observable('Loading...');
    self.currentOpenedMarker;
    var markersFinalArray = ko.observableArray([]);
    var infoWindowHTML = $('#info-window');





    // Google maps init
    var map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(40.8333467, -48.1009912),
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        }
    });

    // Init GMaps geocoder
    var geocoder = new google.maps.Geocoder();

    // Init GMaps autocomplete
    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('pac-input'), {
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(-90, -180),
            new google.maps.LatLng(90, 180)),
        types: ['(cities)']
    });

    // Creates a marker with the geocoded user info
    function geocodeInput() {

        // Get autocomplete result by checking the value of the input
        var address = $('#pac-input').val();

        // Pass the value to Google Maps' geocode method
        geocoder.geocode( { 'address': address}, function(results, status) {

            // If geocode request is succesful
            if (status == google.maps.GeocoderStatus.OK) {

                // Re-center map to the new location
                map.setCenter(results[0].geometry.location);

                // Extract name and coordinates from geocode results
                cityName = results[0].formatted_address;

                // Geocode returns a LatLng object, so in order to get the lat and long, we need to use lat() and lng() methods
                cityLat = results[0].geometry.location.lat();
                cityLong = results[0].geometry.location.lng();

                // Call our marker creator with the new marker's info
                new createMarker(cityName, cityLat, cityLong, true);

                // Store the locations marker in localstorage
                self.storeLocally();


            } else {
            alert("Geocode was not successful for the following reason: " + status);
          }
        });
    }

    // Local storage management
    self.storeLocally = function(){

        // Create a new array with markersFinalArray() data. For each item we need: lat, lng and name. We leave out the marker. This is necessary because JSON.stringify cannot do its job in an array that contains objects containing GMaps markers

        var markers = markersFinalArray();

        var storeArray = [];

        $.each(markers, function(k, v) {


            markerObject = {
                name: v.name,
                lat: v.lat,
                long: v.long,
                userCreated: v.userCreated
            }

            storeArray.push(markerObject);

        });


        localStorage.setItem('userLocalData', JSON.stringify(storeArray));


    };


    // Listens for 'enter' key. Hides the overlay and calls geocodeInput
    $('#pac-input').keyup(function (e) {
        if (e.keyCode == 13) {
             $('#add-overlay').hide();
            geocodeInput();
        }
    });

    // Markers processing function
    var createMarker = function(name, lat, long, userCreated) {



        // Create marker with given data and add it to the final markers array
        markersFinalArray.push({
            marker: new google.maps.Marker({
                position: new google.maps.LatLng(lat, long),
                title: name,
                animation: google.maps.Animation.DROP,
                map: map,
                icon: ((userCreated)?'http://maps.google.com/mapfiles/ms/micons/blue.png':'http://maps.google.com/mapfiles/ms/micons/red.png')


            }),
            name: name,
            lat: lat,
            long: long,
            userCreated: userCreated
        });

        // Add click listener to the fresly created marker
        var maLength = markersFinalArray().length;
        var maLast = markersFinalArray()[maLength - 1];
        var maItem = maLast.marker;
        var maName = maLast.name;
        var maLat = maLast.lat;
        var maLong = maLast.long;

        maItem.addListener('click', function() {
            self.clickOnItem(maName, maItem, maLat, maLong, userCreated);
        });
    };

    // Delete Marker
    self.deleteMarker = function(clickedItem){
        var name = clickedItem.name;
        for (var key in markersFinalArray()) {
            if (name === markersFinalArray()[key].name) {
                markersFinalArray()[key].marker.setMap(null);
                markersFinalArray().splice(key, 1);
                markersFinalArray(markersFinalArray());


                self.storeLocally();
            }
        //map.setZoom(3);
        }
    };


    // Initial markers:
    // Check if there's any local storage with data from previous sessions and load it. Otherwise, load default markers.
    //
    // TO-DO: initial markers are set depending on user location

    if (localStorage.getItem('userLocalData') !== null) {

       var storedData = JSON.parse(localStorage.getItem('userLocalData'));

       $.each(storedData, function(k, v) {
            var lat = v.lat;
            var long = v.long;
            var name = v.name;
            var userCreated = v.userCreated;


           new createMarker(name, lat, long, userCreated);
        });


    } else {

        // Get Initial locations from the server I set up for this purpose

        var initialLocationsURL = 'http://paperbac.pairserver.com/locations.php';

        $.getJSON(initialLocationsURL, function(data) {

            var locations = data.locations;

            $.each(locations, function(k, v) {
                var cityCountry = v.city + ', ' + v.country;
                var latitude = v.latitude;
                var longitude = v.longitude;

                new createMarker(cityCountry, latitude, longitude, false);
            });

            self.infoWindow.setContent(infoWindowHTML[0]);

        }).fail(function() {
            console.log('fail ajax');
        });
    }


    // Process click on a marker or list item
    self.clickOnItem = function(name, marker, lat, long, userCreated) {

        $("body").append(infoWindowHTML);

        $('.list-container ul li').each(function(){

            var thisName = $(this).children('.list-item').html();

            if(name === thisName) {
                $(this).addClass('selected').siblings().removeClass('selected');
            }

        });

        // Close currently opened infowindows
        self.closeInfoWindows();

        var splitCity = name.split(',');

        console.log(splitCity);

        self.currentCity(splitCity[0]);
        self.currentCityCountry(name);
        self.currentLocationData(name+'|'+userCreated);

        $('#info-window').show();
        $('#location-info').fadeIn();

        var icon;
        var userSelectedIcon = 'http://maps.google.com/mapfiles/kml/paddle/blu-stars.png';
        var defaultSelectedIcon = 'http://maps.google.com/mapfiles/kml/paddle/red-stars.png'

        if(userCreated){
            icon = userSelectedIcon;
        } else {
            icon = defaultSelectedIcon;
        }

        marker.setIcon(icon);


        marker.setAnimation(google.maps.Animation.BOUNCE);

        setTimeout(function() {
            marker.setAnimation(null);
            //self.infoWindow.open(map, marker);
        }, 750);
        var coords = new google.maps.LatLng(lat, long);

        map.panTo(coords);
        map.setZoom(5);
        map.panBy(0, -210);

        var apiCoords = lat + '|' + long;


        self.getWikiData(apiCoords, marker);
        self.getFlickrData(lat, long, name);

    };

    // Function accesed from the VIEW. Uses the name from the clicked item on the list and calls clickOnItem() with its data.
    self.goToMarker = function(clickedItem) {
        var markerName = clickedItem.name;
        for (var key in markersFinalArray()) {
            if (markerName === markersFinalArray()[key].name) {
                var marker = markersFinalArray()[key].marker;
                var markerLat = markersFinalArray()[key].lat;
                var markerLong = markersFinalArray()[key].long;
                var userCreated = markersFinalArray()[key].userCreated;


                self.clickOnItem(markerName, marker, markerLat, markerLong, userCreated);
                //self.filter(markerName); // Sets filter to cu
                setTimeout(function() {
                    //self.infoWindow.open(map, marker);
                }, 750);
            }
        }
    };

    // Clears the filter input and re-centers the map
    self.clearMap = function() {
        self.filter('');
        var coords = new google.maps.LatLng(40.8333467, -48.1009912);
        map.panTo(coords);
        map.setZoom(2);
        self.closeInfoWindows();
        $('#info-window').hide();
        $('body').append(infoWindowHTML);
    };

    // Change Icon
    self.closeInfoWindows = function() {


        var currentData = self.currentLocationData().split('|');

        var markerName = currentData[0];
        var userCreated = currentData[1];


        for (var key in markersFinalArray()) {
            if (markerName === markersFinalArray()[key].name) {
                var marker = markersFinalArray()[key].marker;

                if(userCreated === 'true') {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/micons/blue.png');
                } else {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/micons/red.png');
                }

                // Check if it is user created
                // Assing icon to variable
                // Set icon to marker


            }
        }




        self.infoWindow.close();
    };

    google.maps.event.addListener(self.infoWindow, 'closeclick', function() {
        self.clearMap();
    });

    // Closes infowindows when the map is clicked
    google.maps.event.addListener(map, "click", function(event) {
        var map = self.infoWindow.getMap();

        // Only act if an infowindow is open
        if (map !== null && typeof map !== 'undefined') {
            self.clearMap();
        }
    });

        // The filtering happens here
    self.filteredItems = ko.computed(function() {

        // // Close any currently open infowindow
        self.closeInfoWindows();


        // Set the filter words specified by the user to lower case
        var filter = self.filter().toLowerCase();

        // If the filter box is empty, return the full array and show all markers
        if (!filter) {
            for (var i = 0; i < markersFinalArray().length; i++) {
                markersFinalArray()[i].marker.setVisible(true);
            }
            return markersFinalArray();

            // If the user has entered something into the filter box, use knockout's utility function 'arrayFilter' to get filtered results
        } else {
            return ko.utils.arrayFilter(markersFinalArray(), function(mark) {

                // Loop through all the entries in the markers array
                for (var key in markersFinalArray()) {

                    // Set the marker name to lowercase to compare with filter
                    var markerName = markersFinalArray()[key].name.toLowerCase();

                    // If the result of the 'search' method is equal or more than zero, set matching markers' visibility to true
                    if (markerName.search(filter) >= 0) {
                        markersFinalArray()[key].marker.setVisible(true);

                        // Else, hide them
                    } else {
                        markersFinalArray()[key].marker.setVisible(false);
                    }
                }

                // From the markers array, return only those items that match the filter. This is used to filter the list of items, not the markers.
                return mark.name.toLowerCase().search(filter) >= 0;
            });
        }
    });

    // Manage listener on 'esc' key. Closes overlay or clears map depending on context
    $(document).keyup(function (e) {
        if (e.keyCode == 27) {
            if($('#add-overlay').is(':visible')) {
                $('#add-overlay').hide();
            } else {
                self.clearMap();
                self.deleteMarker(clickedItem);
            }
        }
    });




    self.getWikiData = function(coords, marker) {

        // Empty wikiArticles array
        self.wikiArticles().length = 0;

        // Define wiki api url
        var wikiURL = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages%7Cinfo&list=&generator=geosearch&piprop=thumbnail&pithumbsize=80&pilimit=4&inprop=url&ggscoord=' + coords + '&ggsradius=10000&ggslimit=4&callback=?';


        $.getJSON(wikiURL, function(data) {


            var wikiItems = data.query.pages;


            $.each(wikiItems, function(k, v) {
                var wikiTitle = v.title;
                var wikiURL = v.fullurl;

                if ('thumbnail' in v) {
                    var wikiThumb = v.thumbnail.source;
                    var wikiThumbW = v.thumbnail.width;
                    var wikiThumbH = v.thumbnail.height;
                } else {
                    var wikiThumb = 'http://thumbnail.image.rakuten.co.jp/@0_mall/com/css/c/pc/img/nopicture/nopicture.gif?_ex=128x128';
                }

                var wikiObject = {
                    title: wikiTitle,
                    thumbnail: wikiThumb,
                    thumbnailWidth: wikiThumbW,
                    thumbnailHeight: wikiThumbH,
                    url: wikiURL
                }

                self.wikiArticles.push(wikiObject);

            });


            self.infoWindow.setContent(infoWindowHTML[0]);

        }).fail(function() {
            console.log('fail ajax');
        });


    };


    self.getFlickrData = function(lat, long, name) {

        // Flickr sometimes takes a while to load. Let's show a loading gif!
        $('#flickr-gallery').hide();
        $('#flickr-load').show();


        // Empty flickrPics array
        self.flickrPics().length = 0;

        // URL enconde the city name (without country) for the API request
        var urlEncodedName = encodeURIComponent(name.split(',')[0].trim());

        // API key assigned by flickr
        var flickrAPIkey = '3a36e9a73746f67a89753089747aede3';

        // Construct URL to call flickr's API
        var flickrURL = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + flickrAPIkey + '&format=json&nojsoncallback=1&per_page=10&tags=' + urlEncodedName + ',tourist&tag_mode=all';

        // Ajax call to flickr's API
        $.getJSON(flickrURL, function(data) {

            // From the returned JSON, select the array that contains the pictures and store it in a variable
            var flickrItems = data.photos.photo;

            // Loop through the array, create URL's and store them in the flickrPics observable array
            $.each(flickrItems, function(k, v) {

                var photoFarm = v.farm;
                var photoServer = v.server;
                var photoID = v.id;
                var photoSecret = v.secret;
                var photoOwner = v.owner;
                var photoTitle = v.title;

                var photoSrc = 'http://farm' + photoFarm + '.static.flickr.com/' + photoServer + '/' + photoID + '_' + photoSecret + '.jpg';

                var photoThumb = 'http://farm' + photoFarm + '.static.flickr.com/' + photoServer + '/' + photoID + '_' + photoSecret + '_t.jpg';

                var photoURL = 'http://www.flickr.com/photos/' + photoOwner + '/' + photoID;

                var flickrObject = {
                    src: photoSrc,
                    thumb: photoThumb,
                    subHtml: photoTitle
                }

                self.flickrPics.push(flickrObject);

            });
        }).fail(function() {
            console.log('fail ajax');
        }).always(function() {
            // When the call is completed, hide the loading gif!
            $('#flickr-load').fadeOut(500);
            $('#flickr-gallery').delay(500).fadeIn(500);


            $("#flickr-gallery").lightGallery({
                thumbnail: true,
                animateThumb: true
                // dynamic: true,
                // dynamicEl: self.flickrPics()
            });

            $('#flickr-gallery').on('onBeforeClose.lg',function(event){


                $('#location-info').fadeIn();
                $(this).data('lightGallery').destroy(true);

            });
        });

    };




// If you created your Autocomplete with some options, like var autocompleteOptions = { componentRestrictions: { country: 'fr'}};, don't forget to re-add these options in the last line of the @amirnissim answer, as var autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions); I just have this problem and lost 1/2 hour on it. BTW, thanks for this very nice answer


    (function pacSelectFirst(input){
        // store the original event binding function
        var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;

        function addEventListenerWrapper(type, listener) {
        // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
        // and then trigger the original listener.

        if (type == "keydown") {
          var orig_listener = listener;
          listener = function (event) {
            var suggestion_selected = $(".pac-item-selected").length > 0;
            if (event.which == 13 && !suggestion_selected) {
              var simulated_downarrow = $.Event("keydown", {keyCode:40, which:40})
              orig_listener.apply(input, [simulated_downarrow]);
            }

            orig_listener.apply(input, [event]);
          };
        }

        // add the modified listener
        _addEventListener.apply(input, [type, listener]);
      }

      if (input.addEventListener)
        input.addEventListener = addEventListenerWrapper;
      else if (input.attachEvent)
        input.attachEvent = addEventListenerWrapper;

    })($('#pac-input')[0]);



}

// Necessary to keep jQuery working
ko.bindingHandlers.listClick = {
    // init: function(element) {
    //     $(element).on('click', function() {
    //         $(this).siblings().removeClass('selected');
    //         $(this).addClass('selected');
    //         if ($(window).width() <= 1024) {
    //             $('.toggle-controls, .overlay, .list').toggle();
    //         }
    //     });
    // }
};

ko.applyBindings(new viewModel());



// if ($('input').val() !== '') {
//  $('.clear-filter').css('display', 'block');
// } else {
//  $('.clear-filter').css('display', 'none');
// }



// $('#locations-filter').on('focus keydown', function() {
//     if ($(window).width() <= 1024) {
//         $('.toggle-controls').css('display', 'none');
//         $('.overlay, .list').css('display', 'block');
//     }
// });

// $('.overlay, .close-icon, .toggle-controls').on('click', function() {
//     if ($(window).width() <= 1024) {
//         $('.toggle-controls, .overlay, .list').toggle();
//     }
// });



// var openAddOptions = function() {



//         $('#add-overlay').show();
//         $('#pac-input').val('').focus();
//         $('#overlay-close-button').on('click', function(){
//             $(this).parent().hide();
//         });


// };

// $('#add-button').on('click', function(){
//     openAddOptions();
// });

// $(document).keyup(function (e) {
//     if (e.keyCode == 16) {
//        openAddOptions();
//     }
// });




// $('#wikipedia-button').on('click', function(){
//     $('#wiki-window').show().siblings().hide();
// });

// // $('#flickr-button').on('click', function(){
// //     $('#flickr-window').show().siblings().hide();
// // });


// $('.go-back').on('click', function(){
//     $('#location-info').show().siblings().hide();
// });



/////




