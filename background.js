window.addEventListener( 'load', function() {
  function request( params ) {
    return new Promise(
      function( resolve, reject ) {
        var req = new XMLHttpRequest;
        var method = params.method || 'GET';
        var timeout = params.timeout || this.timeout;
        var postData = params.data;

        // always send empty data
        if ( method == 'POST' && !postData ) {
          postData = '';
        }

        req.open( method, params.url, true );
        req.setRequestHeader( 'Content-Type', 'application/json' );
        //req.timeout = timeout;

        req.onreadystatechange = function () {
          if ( req.readyState != 4 ) {
            return;
          }

          // ignore JSON parsing errors
          var jsonObj = {};
          try {
            jsonObj = JSON.parse( req.responseText );
            resolve( jsonObj );
          } catch( err ) {}

          if ( req.status != 200 && req.status != 201 && req.status != 304 ) {
            var errorMessage = typeof jsonObj == 'array' ? jsonObj.pop().join( ' ' ) : req;
            reject( errorMessage );

            return;
          }
        }

        if ( req.readyState == 4 ) {
          return;
        }

        req.send( postData );
      }
    )
  }

  chrome.extension.onRequest.addListener(
    function ( type, sender, callback ) {
      var storagePrefix = 'store.settings.'
      var key;
      var pairs = {};
      for ( var k in localStorage ) {
        if ( k.indexOf( storagePrefix ) == 0 ) {
          key = k.substr(storagePrefix.length );

          // remove quotes from stored values
          pairs[ key ] = localStorage[ k ].replace( /^\"|\"$/g, '' );
        }
      }

      callback( pairs );
    }
  );

  /* Crude message listener for cross-origin requests. */
  chrome.runtime.onMessage.addListener(
    function( params, sender, sendResponse ) {
      request( params ).then( function( resp ) {
        sendResponse(
          {
          success: resp
          }
        );
      }).catch( ( err ) => {
        sendResponse(
          {
            error: err
          }
        );
      });

      return true
    }
  );
});
