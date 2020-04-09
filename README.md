# Lovelace Rockrobo Path Card

Inspired by [TheLastProject/lovelace-valetudo-map-card ](https://github.com/TheLastProject/lovelace-valetudo-map-card).

Draws the path from a Xiaomi vacuum cleaner, that is rooted and flashed with Valetudo or Valetudo RE, in a [Home Assistant](https://www.home-assistant.io/) Lovelace card.
The result is produced in SVG to allow clean integration in picture-elements cards.

## Installation 

Add the `rockrobo-path-card.js` file in your module folder (e.g. `/www/modules/`) then add the import in `ui-lovelace.yaml` configuration:
```yaml
resources:
  - url: /local/modules/rockrobo-path-card.js?v=1.0.1
    type: module
```

## Configuration

### Sensor in Home Assistant

The first step is to add a new MQTT sensor in your HA configuration:
```yaml
sensor:
  - platform: mqtt
    state_topic: "valetudo/rockrobo/state"
    json_attributes_topic: "valetudo/rockrobo/map_data"
    name: vacuum_map
    value_template: "{{ value_json.state }}"
    scan_interval: 5
```
Note: If you are using Valetudo RE with valetudo-mapper, use `valetudo/rockrobo/map_data_parsed` as `json_attributes_topic` instead.

### Lovelace configuration

Then, you can add this custom element to your Lovelace views. This module is perfect for a picture-elements integration as it will resize with parent element:
```yaml
type: custom:rockrobo-path-card
entity: sensor.vacuum_map
show_vacuum: true
vacuum_image: /local/images/icons/vacuum.svg
path_color: rgb(20,20,20,1)
path_width: 3
rotate: 185
icon_scale: 3
zone:
  min_x: 854
  max_x: 2810
  min_y: 2323
  max_y: 3198
style: 
  top: 64%
  left: 2.5%
  width: 98%
  --paper-card-background-color: rgb(0,0,0,0)
  --ha-card-box-shadow: rgb(0,0,0,0)
```

It's highly recommended to exclude the sensor from recorder to keep database small:
```yaml
recorder:
  exclude:
    entities:
      - sensor.vacuum_map
```

## Options
| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:rockrobo-path-card`
| entity | string | | Sensor to get state from
| path_color | string | '--valetudo-map-path-color', '--primary-text-color' | Path color
| path_width | number | 1 | Path line width
| show_vacuum | boolean | true | Draw the vacuum on the map
| vacuum_scale | number | 1 | Scale the vacuum image by this value (in vw)
| rotate | number | 0 | Value to rotate the map by (in deg)
| zone | Object | {min_x: 0, max_x: 0, min_y: 0, max_y: 0} | Fix the map coordinates to avoid dynamic resizing. They corresponds to 1/10th of Xiaomi coordinates. If not set, those values will be determined with the bounds of the current vacuum path.

Colors can be any valid CSS value in the card config, like name (red), hex code (#FF0000), rgb(255,255,255), rgba(255,255,255,0.8)...
