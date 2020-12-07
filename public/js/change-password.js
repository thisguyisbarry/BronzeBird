$(document).ready(function(){
    const urlParams = new URLSearchParams(window.location.search);
    $('#username').val(urlParams.get('username'));
    $('#token').val(urlParams.get('token'));
});