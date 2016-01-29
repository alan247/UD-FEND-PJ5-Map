


	$('input').on('focus', function(){
		if ($(window).width() <= 1024){
			$('.toggle-controls, .overlay, .list').css('display', 'block');
		}
	});

    $('.overlay, li, .close-icon, .toggle-controls').on('click', function(){
      	if ($(window).width() <= 1024){
			$('.toggle-controls, .overlay, .list').toggle();
		}
    });

