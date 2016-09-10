//=============================================================================
// Vektor Weather System v1.0
// by TheVektorKnight/Derek de la Peza
// Date: 4/18/2016  
//=============================================================================

/*:
 * @plugindesc Enhanced alternative to the built-in weather system offering extended customization.
 * @author TheVektorKnight/Derek de la Peza
 *
 * @param Sprite Count Multiplier
 * @desc Power x Multiplier = Sprite Density (Vanilla Default = 10)
 * Higher values may negatively impact performance!
 * @default 30
 *
 * @param Rain Streak Width
 * @desc Desired width rain streaks in pixels.
 * @default 1
 *
 * @param Rain Streak Speed
 * @desc Desired speed at which rain falls in pixels per frame.
 * @default 16
 *
 * @param Storm Streak Width
 * @desc Desired width of stormy rain streaks in pixels.
 * @default 2
 *
 * @param Storm Streak Speed
 * @desc Desired speed at which stormy rain streaks fall in pixels per frame.
 * @default 24
 *
 * @param Snow Flake Radius
 * @desc Desired radius of snow flakes in pixels.
 * @default 4
 *
 * @param Snow Fall Speed
 * @desc Desired speed at which snow flakes fall in pixels per frame
 * @default 3
 *
 * @param Sand Particle Size
 * @desc Desired size of sand particles in pixels
 * @default 4
 *
 * @param Sand Particle Speed
 * @desc Desired speed at which sand particles traverse the screen in pixels per frame.
 * @default 16
 *
 * Plugin Command:
 * VektorWeather type power duration
 * @help Plugin Command Format: [VektorWeather type power duration]
 * Types: rain, storm, snow, sandstorm
 * Power: Value between 1 and 9 inclusive
 * Duration: Fade-in duration in frames
 *
 * This plugin is free to use in any free or commercial project 
 * so long as credit is given.
 * Credit: TheVektorKnight/Derek de la Peza
 */

(function() {
	//Set up parameters
	var parameters = PluginManager.parameters('VEK_WeatherSystem');

	var _spriteCountMultiplier = Number(parameters['Sprite Count Multiplier']);

	var _rainStreakWidth = Number(parameters['Rain Streak Width']);
	var _rainStreakSpeed = Number(parameters['Rain Streak Speed']);

	var _stormStreakWidth = Number(parameters['Storm Streak Width']);
	var _stormStreakSpeed = Number(parameters['Storm Streak Speed']);

	var _snowFlakeRadius = Number(parameters['Snow Flake Radius']);
	var _snowFallSpeed = Number(parameters['Snow Fall Speed']);

	var _sandParticleSize = Number(parameters['Sand Particle Size']);
	var _sandParticleSpeed = Number(parameters['Sand Particle Speed']);

	var _randomNumber; //No Touchy
	var _thunderSound = {name: "Thunder1", volume: 80, pitch: 50, pan: 0};

	//Plugin Command: Set Weather
	var vek_Weather_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		if (command == 'VektorWeather') {
			$gameScreen.changeWeather(args[0], args[1], args[2]);
		}
	};

	//Create bitmaps for each weather type
	var vek_Weather_createBitmaps = Weather.prototype._createBitmaps;
	Weather.prototype._createBitmaps = function() {
		this._rainBitmap = new Bitmap(_rainStreakWidth, 80);
    	this._rainBitmap.fillAll('lightblue');
    	this._stormBitmap = new Bitmap(_stormStreakWidth, 90);
    	this._stormBitmap.fillAll('lightblue');
    	this._snowBitmap = new Bitmap(9, 9);
    	this._snowBitmap.drawCircle(4, 4, _snowFlakeRadius, 'white');
    	this._sandBitmap = new Bitmap(_sandParticleSize, _sandParticleSize);
    	this._sandBitmap.fillAll('#ffcc66');
	};

	//Update weather sprites
	var vek_Weather_updateAllSprites = Weather.prototype._updateAllSprites;
	Weather.prototype._updateAllSprites = function() {
    	var maxSprites = Math.floor(this.power * _spriteCountMultiplier);
    	while (this._sprites.length < maxSprites) {
        	this._addSprite();
    	}
    	while (this._sprites.length > maxSprites) {
        	this._removeSprite();
    	}
    	this._sprites.forEach(function(sprite) {
        	this._updateSprite(sprite);
        	sprite.x = sprite.ax - this.origin.x;
        	sprite.y = sprite.ay - this.origin.y;
    	}, this);
	};

	//Update the current weather effect
	var vek_Weather_updateSprite = Weather.prototype._updateSprite;
	Weather.prototype._updateSprite = function(sprite) {
    	switch (this.type) {
    	case 'rain':
        	this._updateRainSprite(sprite);
        	break;
    	case 'storm':
        	this._updateStormSprite(sprite);
        	this._effectLightning(_randomNumber, _thunderSound);
        	break;
    	case 'snow':
        	this._updateSnowSprite(sprite);
        	break;
        case 'sandstorm':
        	this._updateSandSprite(sprite);
        	break;
    	}
    	if (sprite.opacity < 40) {
        	this._rebornSprite(sprite);
    	}
	};

	//Updates the rain sprites
	var vek_Weather_updateRainSprite = Weather.prototype._updateRainSprite;
	Weather.prototype._updateRainSprite = function(sprite) {
    	sprite.bitmap = this._rainBitmap;
    	sprite.rotation = Math.PI / 16;
    	sprite.ax -= _rainStreakSpeed * Math.sin(sprite.rotation);
    	sprite.ay += _rainStreakSpeed * Math.cos(sprite.rotation);
    	sprite.opacity -= 6;
	};

	//Updates the storm sprites
	var vek_Weather_updateStormSprite = Weather.prototype._updateStormSprite;
	Weather.prototype._updateStormSprite = function(sprite) {
    	sprite.bitmap = this._stormBitmap;
    	sprite.rotation = Math.PI / 8;
    	sprite.ax -= _stormStreakSpeed * Math.sin(sprite.rotation);
    	sprite.ay += _stormStreakSpeed * Math.cos(sprite.rotation);
    	sprite.opacity -= 6;
	};

	//Random thunder/lightning
	Weather.prototype._effectLightning = function(random, se) {
		random = Math.randomInt(150000);
		if (random == 1000) {
			AudioManager.playSe(se);
			$gameScreen.startFlash([255,255,255,255], 60);
		}
	};

	//Updates the snow sprites
	var vek_Weather_updateSnowSprite = Weather.prototype._updateSnowSprite;
	Weather.prototype._updateSnowSprite = function(sprite) {
    sprite.bitmap = this._snowBitmap;
    sprite.rotation = Math.PI / 16;
    sprite.ax -= _snowFallSpeed * Math.sin(sprite.rotation);
    sprite.ay += _snowFallSpeed * Math.cos(sprite.rotation);
    sprite.opacity -= 3;
	};

	//Updates the sand sprites
	Weather.prototype._updateSandSprite = function(sprite) {
    sprite.bitmap = this._sandBitmap;
    sprite.rotation = Math.PI / 3;
    sprite.ax -= _sandParticleSpeed * Math.sin(sprite.rotation);
    sprite.ay += _sandParticleSpeed * Math.cos(sprite.rotation);
    sprite.opacity -= 6;
	};
})();
