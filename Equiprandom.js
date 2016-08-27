//=============================================================================
// ItemAffixes v0.3
//=============================================================================

/*:
 * @plugindesc Add affixes to your items, weapons, and armor!
 * @author Vlue
 *
 * @help Item Affixes v0.3
 *
 *  Quick Reference:
 *    $gameParty.addNewItem("type",id)     - "weapon", "armor", or "item"
 *    <PREFIX [id,weight],[id,weight]...>
 *    <SUFFIX [id,weight],[id,weight]...>
 *    <CRAFTEDNAME name>                    - Use the name on the crafted item
 *                                          Otherwise will use the name property
 *    <COLOR colorCode>                    - Color code being a 6 character hex color code
 *
 *  How it works:
 *   An item can take both an prefix and/or a suffix.
 *   Affixes are other items in the database, an affix applied to an item
 *    adds the parameters and any non-empty details of the affix item (this
 *    includes traits!)
 *
 *   But how do you determine what affix goes where!? Good question! Notetags!
 *    <PREFIX [id,weight],[id,weight]...>
 *    <SUFFIX [id,weight],[id,weight]...>
 *   Where id is the database id of the affix item (drop the trailing zeros! its
 *    1 not 001) and weight is the chance of that affix applying. Higher weight
 *    better chance!
 *   You can also declare a range of affixes instead of just one, i.e. for affixes
 *    id 5 to 10 you'd put in 5-10 in place of id.
 *
 *   An example:
 *    <PREFIX [5,1],[10,2],[3,10]>
 *    <SUFFIX [1,1],[2-5,100]>
 *
 *   But now what!? Well, we use the fancy script call (yes its a script call
 *    for now), to create the new item and add it to the inventory.
 *    $gameParty.addNewItem("type", id)
 *   Where type is either "weapon", "armor", or "item", and id is.. of course
 *    the database Id. An example for a weapon of id 005:
 *   $gameParty.addNewItem("weapon",5)
 *
 *   What's copied over? How does it work? Well:
 *    Name (before original if prefix, after if suffix)
 *    Animation Id (Weapon-only, only if set)
 *    Description (Only if not empty)
 *    Icon (If not set to 0)
 *    Params (Added to original)
 *    Price (Special case, price is multiplied by 1/100th of affix price
 *      (i.e. 50 = 0.5 or half of original price)
 *    Traits (All traits from affix item are added to original)
 *
 */

(function() {

Game_Party.prototype.addNewItemByItem = function(item) {
	var type = null;
	if(DataManager.isItem(item)) { type = "item"; }
	if(DataManager.isWeapon(item)) { type = "weapon"; }
	if(DataManager.isArmor(item)) { type = "armor"; }
	this.addNewItem(type, item.id);
}
Game_Party.prototype.addNewItem = function(type, id, ignore) {
	ignore = ignore || false;
	var container = this.getContainer(type);
	var newItem = JsonEx.makeDeepCopy(container[id]);
	newItem.name = newItem.note.match(/<CRAFTEDNAME (.+)>/)[1] || newItem.name;
	this.assignAffixes(type, newItem);
	newItem.id = container.length;
	container.push(newItem);
	if(!ignore) {
		this.gainItem(newItem, 1);
	}
	return newItem;
}
Game_Party.prototype.getContainer = function(item) {
	if(item == "weapon") {return $dataWeapons; }
	if(item == "armor") {return $dataArmors; }
	if(item == "item") {return $dataItems; }
	return [];
}
Game_Party.prototype.assignAffixes = function(type, item) {
	var prefixes = item.note.match(/<PREFIX (.+)>/);
	if(prefixes != null) {
		prefixes = this.getAffixes(prefixes);
		this.assignAffix(type, item, prefixes[Math.floor(Math.random() * prefixes.length)], true)
	}
	var suffixes = item.note.match(/<SUFFIX (.+)>/);
	if(suffixes != null) {
		suffixes = this.getAffixes(suffixes);
		this.assignAffix(type, item, suffixes[Math.floor(Math.random() * suffixes.length)], false)
	}
}
Game_Party.prototype.getAffixes = function(string) {
	var affixList = [];
	var test = string[1]
	// var affixes = JSON.parse("[" + string[1].replace(/(\d+)-(\d+)/g, '[$1,$2]') + "]");
	var affixes = JSON.parse("[" + string[1].replace(/(\d+)-(\d+)/g, generateIdRange) + "]");
	for(var i = 0;i < affixes.length;i++) {
		if(Array.isArray(affixes[i][0])) {
			for(var j = 0;j < affixes[i][0].length;j++) {
				for(var k = 0;k < affixes[i][1]/affixes[i][0].length;k++) {
					affixList.push(affixes[i][0][j]);
				}
			}
		} else {
			for(var j = 0;j < affixes[i][1];j++) {
				affixList.push(affixes[i][0]);
			}
		}
	}
	return affixList;

	function generateIdRange(match, startId, endId) {
		var idRange = '[';
		for (var id = startId; id < endId; id++) {
		    idRange += id + ',';
		}
		idRange += endId + ']';
		return idRange;
	}
}
Game_Party.prototype.assignAffix = function(type, item, affixId, prefix) {
	if(affixId == 0) { return; }
	var container = this.getContainer(type);
	var affix = container[affixId];
	if(prefix == false) {
		item.name += ' ' + affix.name.trim();
		item.description += ' ' + affix.description.trim();
	} else {
		item.name = affix.name.trim() + ' ' + item.name.trim();
		item.description = affix.description.trim() + ' ' + item.description.trim();
	}
	var colorData = affix.note.match(/<COLOR (.+)>/);
	if(colorData) {
		item._color = colorData[1];
	}
	if(affix.iconIndex > 0) { item.iconIndex = affix.iconIndex; }
	for(var i = 0;i < affix.params.length;i++) {
		item.params[i] += affix.params[i];
	}
	if(affix.price > 0) { item.price = Math.round( item.price * affix.price / 100); }
	for(var i = 0;i < affix.traits.length;i++) {
		item.traits.push(affix.traits[i]);
	}
	if(type == "armor") {
		if(affix.atypeId > 0) { item.atypeId = affix.atypeId; }
	}
	if(type == "weapon") {
		if(affix.animationId > 0) { item.animationId = affix.animationId; }
		if(affix.wtypeId > 0) { item.wtypeId = affix.wtypeId; }
	}

}

Window_Base.prototype.drawItemName = function(item, x, y, width) {
    width = width || 312;
    if (item) {
        var iconBoxWidth = Window_Base._iconWidth + 4;
		if(item._color) {
			this.changeTextColor("#" + item._color);
		} else {
			this.resetTextColor();
		}
        this.drawIcon(item.iconIndex, x + 2, y + 2);
        this.drawText(item.name, x + iconBoxWidth, y, width - iconBoxWidth);
		this.resetTextColor();
    }
};

var randomEq_DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
    var contents = randomEq_DataManager_makeSaveContents.call(this);
	contents.weapons = $dataWeapons;
	contents.armor = $dataArmors;
	contents.items = $dataItems;
    return contents;
};
var randomEq_DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
	randomEq_DataManager_extractSaveContents.call(this, contents);
	$dataWeapons = contents.weapons || $dataWeapons;
	$dataArmors = contents.armors || $dataArmors;
	$dataItems = contents.items || $dataItems;
};

/*
 * Since I'm not going to drop any weapons on the map, I comment this out
 */
// Game_Enemy.prototype.itemObject = function(kind, dataId) {
// 		/*
// 		 * addNewItem should only work with Weapon or Armor,
// 		 * for type "item", since we don't have any affixes for it, we should ignore
// 		 * Besides this, the gainItem method should be called in the Recipecrafting.js plugin
// 		 * So always set ignore = true when calling the addNewItem method
// 		 */
//     // if (kind === 1) {
//     //     return $gameParty.addNewItem("item",dataId,false);
//     // } else if (kind === 2) {
//     //     return $gameParty.addNewItem("weapon",dataId,false);
//     // } else if (kind === 3) {
//     //     return $gameParty.addNewItem("armor",dataId,false);
//     // } else {
//     //     return null;
//     // }
// 		if (kind === 1) {
// 				return $dataItems[dataId];
// 		}
// 		else if (kind === 2) {
// 		    return $gameParty.addNewItem("weapon",dataId,true);
// 		} else if (kind === 3) {
// 		    return $gameParty.addNewItem("armor",dataId,true);
// 		} else {
// 		    return null;
// 		}
// };


})();
