//TODO List

//Add unique coloration for maternal vs paternal familial relationships
//Should sibiling relationships be visualized with an edge?
//Add "freeze" button to stop graph ticks

function setupSocialGraph(individualID) {
    let focusedScale = 1.25;
    let sg = new SocialGraph(individualID, focusedScale);
    sg.graphSocialData(false, [0,0]); //Dummied method
}

class SocialGraph extends ForceLayoutAbstract {
    constructor(individualID, focusedScale) {
	super(individualID, focusedScale);
	
	//TODO: Parse this data
	//It would be really great if some clever heirarchical representation could be used
	//to represent this - that way one format can be used for all graph DATA
	this.nodes = [
	    {
		"id": 0,
		"group": 0,
		"data": {
		    "name": "Lion A",
		    "gender": "female",
		    "role": "alpha",
		    "isFocused": true
		}
	    },
	    {
		"id": 1,
		"group": 0,
		"data": {
		    "name": "Lion B",
		    "gender": "female"
		}
	    },
	    {
		"id": 2,
		"group": 1,
		"data": {
		    "name": "Lion C",
		    "gender": "male"
		}
	    },
	    {
		"id": 3,
		"group": 2,
		"data": {
		    "name": "Lion D",
		    "gender": ""
		}
	    },
	    {
		"id": 4,
		"group": 2,
		"data": {
		    "name": "Lion E",
		    "gender": "female"
		}
	    },
	    {
		"id": 5,
		"group": 2,
		"data": {
		    "name": "Lion F",
		    "gender": "male"
		}
	    }
	];

	this.links = [
	    {"source": 0, "target": 1, "type": "paternal"},
	    {"source": 0, "target": 3, "type": "member"},
	    {"source": 3, "target": 4, "type": "maternal"},
	    {"source": 4, "target": 5, "type": "familial"},
	    {"source": 5, "target": 3, "type": "member"},
	    {"source": 2, "target": 1, "type": "member"},
	    {"source": 2, "target": 0, "type": "member"}
	];
    }

    graphSocialData(error, json) {
	if (error) {
	    return console.error(error);
	}

	if (json.length >= 1) {
	    this.appendSvg("#socialDiagram");
	    this.addTooltip("#socialDiagram");	    

	    this.calcNodeSize(this.nodes);
	    this.setNodeRadius();
	    
	    let forces = this.getForces();
	    let [linkRef, nodeRef] = this.createGraph();
	    
	    this.drawNodeOutlines(nodeRef, false);
	    this.drawNodeSymbols(nodeRef, false);
	    this.addNodeText(nodeRef, false);

	    this.enableDrag(nodeRef, forces);
	    this.applyForces(forces, linkRef, nodeRef);
	}
    }
}
