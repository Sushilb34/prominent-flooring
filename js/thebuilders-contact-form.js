(function($){

    var valid = "invalid";
    function validateValue($value, $target, $email){
        if ($email == true) {
            var n = $value.indexOf("@");
            var r = $value.lastIndexOf(".");
            if (n < 1 || r < n + 2 || r + 2 >= $value.length) {
                valid =  "invalid";
            } else {
                valid = "valid";
            }
            
            if ($value == null || $value == "" || valid == "invalid") {
                $target.addClass('visible');
            } else {
                $target.removeClass('visible');
            }

        } else {
            if ($value == null || $value == "") {
                $target.addClass('visible');
            } else {
                $target.removeClass('visible');
            }
        }
    };

    $('.thebuilders-contact-form').each(function(){

        var $this = $(this);

        $this.find(".thebuilders-contact-form-submit").click(function(event) {
            event.preventDefault();
            var name  = $this.find(".thebuilders-contact-form-name").val();
            var email = $this.find(".thebuilders-contact-form-email").val();
            var msg   = $this.find(".thebuilders-contact-form-mgs").val();

            validateValue(name, $this.find(".thebuilders-contact-form-name-valid"));
            validateValue(email, $this.find(".thebuilders-contact-form-email-valid"), true);
            validateValue(msg, $this.find(".thebuilders-contact-form-msg-valid"));
            
            if (name != "" && email != "" && msg != "" && valid == "valid") {
                $this.find(".sending").addClass('visible');
                $.ajax({
                    type: "POST",
                    url: thebuilders_contact_form_ajax.thebuilders_contact_form_ajaxurl,
                    data: {
                        action: "thebuilders_contact_form_send",
                        name: name,
                        email: email,
                        mgs: msg
                    },
                    success: function() {
                        $this.find(".thebuilders-contact-form-submit-success").addClass('visible');
                        $this.find(".sending").removeClass('visible');
                        setTimeout(function(){
                            $this.find(".thebuilders-contact-form-submit-success").fadeOut(300,function(){
                                $(this).removeClass('visible');
                            });
                        },3000);
                    },
                    error: function() {
                        $this.find(".thebuilders-contact-form-submit-error").addClass('visible');
                        $this.find(".sending").removeClass('visible');
                        setTimeout(function(){
                            $this.find(".thebuilders-contact-form-submit-error").fadeOut(300,function(){
                                $(this).removeClass('visible');
                            });
                        },3000);
                    }
                })
            }
        });
    });

})(jQuery);