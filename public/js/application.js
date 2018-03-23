$(document).ready(function(){
    $('input[type=file]').change(function () {
        $('.file-name').text($(this)[0].files[0]['name'] + ' & ' +  $(this)[0].files[1]['name']);
    });
    $('#sort_by').change(function(){
        window.location =`?show=${$(this).val()}`;
    })
});