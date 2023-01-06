<?php
/**
 * Router for the php cli-server built-in webserver.
 *
 * Intended to be used with the gerrit-fe-dev-helper Chrome extension
 *
 * Usage:
 *   php -S 127.0.0.1:8081 -t plugins/ plugins-router.php
 */

if ( PHP_SAPI !== 'cli-server' ) {
	die( "This script can only be run by php's cli-server sapi." );
}

if ( !isset( $_SERVER['SCRIPT_FILENAME'] ) ) {
	// Let built-in server handle error.
	return false;
}

# To let the browser load our plugins when browsing Gerrit
header( 'Access-Control-Allow-Origin: *' );

# Extra headers injected by PHP and the Chrome extension
header( 'Access-Control-Allow-Headers: cache-control, x-test-origin' );

# Browser requires MIME type to be explicitly set when using `import`
$ext = pathinfo( $_SERVER['SCRIPT_FILENAME'], PATHINFO_EXTENSION );
if ( $ext === 'js' ) {
	header( 'Content-Type: text/javascript' );
}

// php8: replace with str_starts_with()
if ( 0 === strpos( $_SERVER['SCRIPT_NAME'], '/zuul/status/change/' ) ) {
	readfile( $_SERVER['DOCUMENT_ROOT'] . '/../test/zuul-status-change.json' );
	return true;
}

readfile($_SERVER["SCRIPT_FILENAME"]);
