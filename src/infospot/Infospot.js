( function () {

	/**
	 * Information spot attached to panorama
	 * @constructor
	 * @param {number} [scale=1] - Infospot scale
	 * @param {imageurl} [imageurl=DEFAULT_INFO_ICON] - Image overlay info
	 */
	PANOLENS.Infospot = function ( scale, imageurl ) {
		
		var scope = this, textureLoader = undefined, ratio = undefined;

		var DEFAULT_INFO_ICON = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSI0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KICAgIDxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0xIDE1aC0ydi02aDJ2NnptMC04aC0yVjdoMnYyeiIvPgo8L3N2Zz4=',
			DEFAULT_ARROW_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAwAAAAMADO7oxXAAACB0lEQVRo3u2ZP0vDQBjGnzf4B+pYx4KDoB9ABGc/hf0O/QCOioN+AaGLm2OX0l3c1clJwUFacFAncYiDj0OuEC7XeM1dcqTND7o0uZffcy13yXtAQ8NyIz6KkIwA7AM4BLAHYAdAB8CGuuUbwATAM4AHADcA7kTkN2h6kh2SFyTHnJ+xGtsJIb5J8pJkXEBcJ1a1NquS75J89yCu806yW6b4Ksl+CeI6fZIrvuVbJEcVyE8ZkWz5nPlhhfJThiRXfQSo4m8zi76r/FFA+SlHeY6SI98G8ASg7eW/WJxPALsi8mm6GOUMPPMgf6o+LrSViz1MdljXTeokVe/EsVbMeXZskue+5D2GOLeVj1js2WamvKcQYyYPjf8GOChD3lOIA5sAx2XJewhxbFN8UKa8Y4iBTeHHsuUdQjzaFP2oQr5giA+bgrbrv7N8gRCxPlYMxWIAa0VlRCT3PZskHbL+iMh6+gvTuvrlPKXlkXEzBXgLbZlDxs0U4Cm0ZQ4ZN1OA+9CWOWTcTAFuQ1vmkHEzrUIRgFcknbW5KXEVmgDY0rt5mV9A3XDta8o8cm1qRRpni8nLwwsc9gPP/ADYFpGJfsH4fK1uvAptneLKJA8s8ku9GtALLA8AvVnyVrDOjS0VoN6tRRWivs3dVIgV1rW9rgWp5wGHFqK+R0xakOCHfMt9zNrQsAD8AdNVkHeWQ1RrAAAAAElFTkSuQmCC';

		THREE.Sprite.call( this );

		this.type = 'infospot';

		this.isHovering = false;
		this.element = undefined;
		this.toPanorama = undefined;

		this.container = document.body;

		// Default is not visible until panorama is loaded
		this.visible = false;

		this.defaultOpacity = 1;

		scale = scale || 1;

		this.scale.set( scale, scale, 1 );

		if ( typeof( imageurl ) === 'string' ) {

			if ( imageurl === 'info' ) {

				imageurl = DEFAULT_INFO_ICON;

			} else if ( imageurl === 'arrow' ) {

				imageurl = DEFAULT_ARROW_ICON;

			}

		}

		textureLoader = new THREE.TextureLoader();

		textureLoader.load( imageurl || DEFAULT_INFO_ICON, postLoad );		

		function postLoad ( texture ) {

			texture.minFilter = texture.maxFilter = THREE.LinearFilter;

			texture.wrapS = THREE.RepeatWrapping;

			texture.repeat.x = -1;

			scope.material.map = texture;

			ratio = texture.image.width / texture.image.height;

			scope.scale.set( ratio * scale, scale, 1 );

			scope.hoverStartScale = scope.scale.clone();
			scope.hoverEndScale = scope.scale.clone().multiplyScalar( 1.3 );
			scope.hoverEndScale.z = 1;

			scope.scaleUpAnimation = new TWEEN.Tween( scope.scale )
				.to( { x: scope.hoverEndScale.x, y: scope.hoverEndScale.y }, 500 )
				.easing( TWEEN.Easing.Elastic.Out );

			scope.scaleDownAnimation = new TWEEN.Tween( scope.scale )
				.to( { x: scope.hoverStartScale.x, y: scope.hoverStartScale.y }, 500 )
				.easing( TWEEN.Easing.Elastic.Out );

			scope.showAnimation = new TWEEN.Tween( scope.material )
				.to( { opacity: scope.defaultOpacity }, scope.animationDuration )
				.onStart( function () { scope.visible = true; } )
				.easing( TWEEN.Easing.Quartic.Out );

			scope.hideAnimation = new TWEEN.Tween( scope.material )
				.to( { opacity: 0 }, scope.animationDuration )
				.onComplete( function () { scope.visible = false; } )
				.easing( TWEEN.Easing.Quartic.Out );

		}

	}

	PANOLENS.Infospot.prototype = Object.create( THREE.Sprite.prototype );

	PANOLENS.Infospot.prototype.onClick = function () {

		if ( this.element ) {

			this.lockHoverElement();

		}

		this.dispatchEvent( { type: 'click' } );

	};

	PANOLENS.Infospot.prototype.onHover = function ( x, y ) {

		if ( !this.isHovering ) {

			this.onHoverStart();
			this.isHovering = true;

		}

		if ( !this.element || this.element.locked ) { return; }

		var left, top;

		left = x - this.element.clientWidth / 2;
		top = y - this.element.clientHeight - 30;

		this.element.style.webkitTransform =
		this.element.style.msTransform =
		this.element.style.transform = 'translate(' + left + 'px, ' + top + 'px)';

	};

	PANOLENS.Infospot.prototype.onHoverStart = function() {

		if ( !this.hoverEndScale.equals( this.scale ) ) {

			this.scaleDownAnimation.stop();
			this.scaleUpAnimation.start();

		}

		if ( this.element && this.element.style.display === 'none' ) {

			this.element.style.display = 'block';

		}

	};

	PANOLENS.Infospot.prototype.onHoverEnd = function() {

		this.isHovering = false;
		
		if ( !this.hoverStartScale.equals( this.scale ) ) {

			this.scaleUpAnimation.stop();
			this.scaleDownAnimation.start();

		}

		if ( this.element && this.element.style.display !== 'none' ) {

			this.element.style.display = 'none';
			this.unlockHoverElement();

		}

	};

	PANOLENS.Infospot.prototype.setText = function ( text ) {

		if ( this.element ) {

			this.element.textContent = text;

		}

	};

	PANOLENS.Infospot.prototype.addHoverText = function ( text ) {

		if ( !this.element ) {

			this.element = document.createElement( 'div' );

			this.element.style.color = '#fff';
			this.element.style.top = 0;
			this.element.style.maxWidth = '50%';
			this.element.style.maxHeight = '50%';
			this.element.style.textShadow = '0 0 3px #000000';
			this.element.style.fontFamily = '"Trebuchet MS", Helvetica, sans-serif';
			this.element.style.position = 'absolute';
			this.element.style.display = 'none';

			this.container.appendChild( this.element );

		}

		this.setText( text );

	};

	PANOLENS.Infospot.prototype.addHoverElement = function ( el ) {

		if ( !this.element ) { 

			this.element = el.cloneNode( true );
			this.element.style.top = 0;
			this.element.style.position = 'absolute';
			this.element.style.display = 'none';

			this.container.appendChild( this.element );

		}

	};

	PANOLENS.Infospot.prototype.removeHoverElement = function () {

		if ( this.element ) { 

			this.container.removeChild( this.element );

			this.element = undefined;

		}

	};

	PANOLENS.Infospot.prototype.lockHoverElement = function () {

		if ( this.element ) { 

			this.element.locked = true;

		}

	};

	PANOLENS.Infospot.prototype.unlockHoverElement = function () {

		if ( this.element ) { 

			this.element.locked = false;

		}

	};

	PANOLENS.Infospot.prototype.show = function ( delay ) {

		delay = delay || 0;

		this.hideAnimation.stop();
		this.showAnimation.delay( delay ).start();

	};

	PANOLENS.Infospot.prototype.hide = function ( delay ) {

		delay = delay || 0;

		this.showAnimation.stop();
		this.hideAnimation.delay( delay ).start();
		
	};

} )()