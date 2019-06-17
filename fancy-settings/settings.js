
window.addEvent("domready", function () {
    // Option 1: Use the manifest:
	new FancySettings.initWithManifest(function ( settings ) {
        settings.manifest.saveAccount.addEvent("action", function ( e ) {
			console.log( settings );
			console.log( settings.manifest.domain.element.value );
			
			function toggleDisplay( ele ) {
				if ( ele.style.display == 'none' ) {
					ele.style.display = 'block';
				} else {
					ele.style.display = 'none';
				}
			};
			
			// test Tender account
			
			var tender = new Tender({ 
				domain: settings.manifest.domain.element.value,
				token: settings.manifest.token.element.value 
			});
			
			var saveButton = document.querySelector( "input[value='Save Changes']" );
			toggleDisplay( saveButton );
			
			// insert progress bar
			var discussion_id = 'extratender-discussion';
			var progress = document.getElementById( discussion_id );
			
			if ( !progress ) {
				progress = document.createElement( 'div' );
				progress.setAttribute( 'id', discussion_id );
				
				saveButton.parentNode.appendChild( progress );
			}			
			
			progress.innerHTML = '<span id="extratender-acct-loader" class="ajaxloader"></span> <span id="extratender-progress-text">Verifying Account...</span>';
			var loader = document.getElementById( 'extratender-acct-loader' );
			loader.style.display = 'inline-block';
			var progressText = document.getElementById( 'extratender-progress-text' );
			
			tender.getUsers( function ( json ) {
				toggleDisplay( saveButton );
				toggleDisplay( loader );
				progressText.className = 'success';
				progressText.innerHTML = 'Account Verified!';
			},
			function ( error ) {
				toggleDisplay( saveButton );
				toggleDisplay( loader );
				progressText.className = 'error';
				progressText.innerHTML = 'Could not verify your account.';
				console.log( 'ERROR' );
				console.log( error );
			});
			
        });
    });
});
