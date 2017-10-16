function CollisionEvent(obj1, obj2, index1, index2) {
	this.tag1 = obj1.tag;
	this.tag2 = obj2.tag;
	this.index1 = index1;
	this.index2 = index2;
	this.isLost = function() {
		if (this.tag1 === "end" || this.tag2 === "end") {
			return true;
		} else {
			return false;
		}
	};
	this.isShootSuccess = function() {
		if (this.tag1 === this.tag2) {
			return true;
		} else {
			return false;
		}
	};
}

function getDist(pos1, pos2) {
	var sum = 0;
	for (var i = 0; i < 3; i++) {
		var a = pos1[i], b = pos2[i];
		sum += (a-b)*(a-b);
	}
	return Math.sqrt(sum);
}

/*
Collision Detection function
Input: collection1 and collection2, two arrays of balls
Output: an array of collision events
*/
function collisionDetection(collection1, collection2, dist = 4) {
	var collisions = [];
	for (var i = 0; i < collection1.length; i++) {
		for (var j = 0; j < collection2.length; j++) {
			var obj1 = collection1[i], obj2 = collection2[j];
			if (getDist(obj1.getPosition(), obj2.getPosition()) <= dist) {
				collisions.push(new CollisionEvent(obj1, obj2, i, j));
			}
		}
	}
	return collisions;
}