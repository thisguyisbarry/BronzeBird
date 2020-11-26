/*
Checks that passwords are matching before allowing submit
*/
$('#password, #confirm_password').on('keyup', function () {
  $(':input[type="submit"]').prop('disabled', true);
  if ($('#password').val() == $('#confirm_password').val()) {
    $('#message').html('Password Matching').css('color', 'green');
    $(':input[type="submit"]').prop('disabled', false);
  } else
    $('#message').html('Password Not Matching').css('color', 'red');
});