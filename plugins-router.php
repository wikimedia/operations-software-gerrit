<?php
/**
 * Router for the php cli-server built-in webserver.
 *
 * Intended to be used with the gerrit-fe-dev-helper Chrome extension
 *
 * Usage:
 *   php -S 127.0.0.1:8081 -t plugins/ plugins-router.php
 *
 * The plugins are mapped under the URL `/r/plugins/` which is the base path
 * used by production Gerrit and used to discover the plugin name. The
 * `wm-checks-api.js` plugin is thus reachable via:
 *
 *   curl http://127.0.0.1:8081/r/plugins/wm-checks-api.js
 *
 * Change $PLUGINS_PREFIX below to expose the plugins under another path.
 */
$PLUGINS_PREFIX = '/r/plugins';

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


// Map `/r/plugins/foo.js` request to read `./foo.js` in the document root
if ( 0 === strpos( $_SERVER['SCRIPT_NAME'], $PLUGINS_PREFIX ) ) {
	$dest = substr( $_SERVER['SCRIPT_NAME'], strlen( $PLUGINS_PREFIX ) );
	$realFile = realpath( $_SERVER['DOCUMENT_ROOT'] . $dest );
	if ( is_readable( $realFile ) && is_file( $realFile ) ) {
		readfile( $realFile );
		return true;
	}
}

http_response_code(404);
print("File not found!\n");
if ( realpath( $_SERVER['DOCUMENT_ROOT'] . $_SERVER['SCRIPT_NAME'] ) ) {
	print("Did you mean: " . $PLUGINS_PREFIX . $_SERVER["SCRIPT_NAME"] . "\n");
}
return true;
