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

readfile($_SERVER["SCRIPT_FILENAME"]);
