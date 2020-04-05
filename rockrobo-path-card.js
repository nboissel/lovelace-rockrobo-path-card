class RockroboPathCard extends HTMLElement {
  constructor() {
    super();
    this.drawingMap = false;
    this.lastUpdatedMap = "";
    this.attachShadow({ mode: 'open' });
    this.lastValidRobotPosition = [];

    this.entityWarning1 = document.createElement('hui-warning');
    this.entityWarning1.id = 'lovelaceRockroboPathWarningHaCard';
    this.shadowRoot.appendChild(this.entityWarning1);

    this.cardContainer = document.createElement('ha-card');
    this.cardContainer.id = 'lovelaceRockroboPathHaCard';
    this.cardContainerStyle = document.createElement('style');
    this.shadowRoot.appendChild(this.cardContainer);
    this.shadowRoot.appendChild(this.cardContainerStyle);
  };

  shouldDrawMap(state) {
    return !this.drawingMap && this.lastUpdatedMap != state.last_updated;
  };

  calculateColor(container, ...colors) {
    for (let color of colors) {
      if (!color) continue;
      if (color.startsWith('--')) {
        let possibleColor = getComputedStyle(container).getPropertyValue(color);
        if (!possibleColor) continue;
        return possibleColor;
      };
      return color;
    };
  };

  drawPath(cardContainer, mapData, pathColor) {

    // Get base info
    const mapAttrs = mapData.attributes;
    const path = mapAttrs.path;
    const robotPosition = mapAttrs.robot ? mapAttrs.robot : this.lastValidRobotPosition;
    let robotAngle = path.current_angle;

    // Create container
    const container = document.createElement('div');

    // Do we need to find zone for the SVG
    let xs = [], ys = [];
    let zone = this._config.zone;
    const undefZone = (zone.min_x === undefined || zone.max_x === undefined || zone.min_y === undefined || zone.max_y === undefined);

    // Create SVG  
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');

    // Vacuum path
    if (path.points) {
      let svgPath = "";
      path.points.forEach(point => {
        // Extract points
        const x = Math.round(point[0] / 10.0);
        const y = Math.round(point[1] / 10.0);
        if(undefZone) {
          xs.push(x);
          ys.push(y);
        }
        svgPath += `L ${x} ${y} `;
      });
      svgPath = svgPath.replace('L', 'M');

      // Get viewBox
      if(undefZone) {
        zone = {
          min_x: Math.min.apply(Math, xs),
          max_x: Math.max.apply(Math, xs),
          min_y: Math.min.apply(Math, ys),
          max_y: Math.max.apply(Math, ys)
        }
        console.log("Zone defined for coordinates: " + JSON.stringify(zone));
      };
      container.appendChild(svg);

      const pathElt = document.createElementNS(ns, 'path');
      pathElt.setAttributeNS(null, 'd', svgPath);
      pathElt.setAttributeNS(null, 'fill', 'transparent');
      pathElt.setAttributeNS(null, 'stroke', pathColor);
      pathElt.setAttributeNS(null, 'stroke-width', this._config.path_width);
      svg.appendChild(pathElt);

    };

    // Config SVG 
    svg.setAttributeNS(null, 'width', '100%');
    svg.setAttributeNS(null, 'viewBox', `${zone.min_x} ${zone.min_y} ${zone.max_x - zone.min_x} ${zone.max_y - zone.min_y}`);

    // Vacuum icon

    const vacuumLink = this._config.vacuum_image;
    if (vacuumLink && robotPosition) {
      this.lastValidRobotPosition = robotPosition;

      const vacuumImage = document.createElementNS(ns, 'image');
      vacuumImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', vacuumLink);
      vacuumImage.setAttributeNS(null, 'x', Math.round(robotPosition[0] / 10.0));
      vacuumImage.setAttributeNS(null, 'y', Math.round(robotPosition[1] / 10.0));
      vacuumImage.setAttributeNS(null, 'transform', `rotate(${robotAngle}deg)`);
      vacuumImage.setAttributeNS(null, 'width', `${this._config.vacuum_scale}vw`);
      vacuumImage.setAttributeNS(null, 'height', `${this._config.vacuum_scale}vw`);
      svg.appendChild(vacuumImage);
    }

    // Put our newly generated map in there
    while (cardContainer.firstChild) {
      cardContainer.firstChild.remove();
    };
    cardContainer.appendChild(container);
  };

  setConfig(config) {
    this._config = Object.assign({}, config);

    if (this._config.show_vacuum === undefined) this._config.show_vacuum = true;
    if (this._config.vacuum_scale === undefined) this._config.vacuum_scale = 1;
    if (this._config.path_width === undefined) this._config.path_width = 1;
    if (this._config.rotate === undefined) this._config.rotate = 0;
    if (Number(this._config.rotate)) this._config.rotate = this._config.rotate;

    if (this._config.zone !== Object(this._config.zone)) this._config.zone = {};
    // {min_x, max_x, min_y, max_y} else it will be determined by min/max of path
  };

  set hass(hass) {
    this._hass = hass;
    let mapEntity = this._hass.states[this._config.entity];

    let canDrawMap = true;

    if (!mapEntity || mapEntity['state'] == 'unavailable' || !mapEntity.attributes || !mapEntity.attributes.image) {
      canDrawMap = false;
    }

    if (!canDrawMap && this._config.entity) {
      // Remove the map
      this.cardContainer.style.display = 'none';

      // Show the warning
      this.entityWarning1.textContent = `Entity not available: ${this._config.entity}`;
      this.entityWarning1.style.display = 'block';
    } else {
      this.entityWarning1.style.display = 'none';
      this.cardContainer.style.display = 'block';
    };

    if (canDrawMap) {

      // Set container CSS
      // height: ${this._config.height}px;
      // width: ${this._config.width}px;
      this.cardContainerStyle.textContent = `
        #lovelaceRockroboPathHaCard {
          height: 100%;
          width:100%;
        }
        #lovelaceRockroboPathHaCard div {
          transform: rotate(${this._config.rotate}deg);
        }
        #lovelaceRockroboPathHaCard image {
          filter: drop-shadow(0 0 ${Math.round(this._config.vacuum_scale / 5.0)}vw black);
        }
      `
      // Calculate colours
      const homeAssistant = document.getElementsByTagName('home-assistant')[0];
      const pathColor = this.calculateColor(homeAssistant, this._config.path_color, '--valetudo-map-path-color', '--primary-text-color');

      // Don't redraw unnecessarily often
      if (this.shouldDrawMap(mapEntity)) {
        // Start drawing map
        this.drawingMap = true;

        this.drawPath(this.cardContainer, mapEntity, pathColor);

        // Done drawing map
        this.lastUpdatedMap = mapEntity.last_updated;
        this.drawingMap = false;
      };
    };
  };

  getCardSize() {
    return 1;
  };
}

customElements.define('rockrobo-path-card', RockroboPathCard);
