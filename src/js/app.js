
   $(document).foundation('joyride', 'start');

        function toggleList() {
            $('.list, .overlay, .show-controls').toggle();
        }

        $('input').on('focus', function(){
            toggleList();
        });

        $('.overlay, li, .close-icon, .show-controls').on('click', function(){
           toggleList();
        });
