import {Component} from 'substance'
import {api} from 'writer'
import LocationListComponent from './LocationListComponent'

// var AuthorSearchComponent = require('writer/components/form-search/FormSearchComponent');
// var LocationDetailComponent = require('./LocationDetailComponent');
// var LocationListComponent = require('./LocationListComponent');

class LocationMainComponent extends Component {

    constructor(...args) {
        super(...args)
    }

    configureFeatures() {
        const features = api.getConfigValue(this.props.panel.id, 'features');

        switch (features) {
            case 'position':
                this.features = 'position';
                this.t = {
                    title: this.getLabel('Positions'),
                    placeholder: this.getLabel('Search positions')
                };
                break;

            case 'polygon':
                this.features = 'polygon';
                this.t = {
                    title: this.getLabel('Areas'),
                    placeholder: this.getLabel('Search areas')
                };
                break;

            default:
                this.features = 'all';
                this.t = {
                    title: this.getLabel('Locations'),
                    placeholder: this.getLabel('Search locations')
                };
        }


        this.polygonIsEditable = api.getConfigValue(
            this.props.panel.id,
            'polygon.editable',
            true
        )
    }


    getInitialState() {
        this.configureFeatures();
        return {
            existingLocations: api.newsItem.getLocations(this.features)
        }
    }

    reload() {
        this.setState({
            existingLocations: api.newsItem.getLocations(this.features)
        })
    }

    render($$) {
        var el = $$('div').addClass('location-main').append(
            $$('h2').append(
                this.t.title
            )
        );

        var locationList = $$(LocationListComponent, {
            locations: this.state.existingLocations,
            openMap: this.openMap.bind(this),
            removeLocation: this.removeLocation.bind(this)
        }).ref('locationList');

        var query = 'q=';
        if (this.features !== 'all') {
            query = 'f=' + this.features + '&q=';
        }

        const AuthorSearchComponent = this.context.componentRegistry.get('form-search')
        var searchComponent = $$(AuthorSearchComponent, {
            existingItems: this.state.existingLocations,
            searchUrl: api.router.getEndpoint() + '/api/search/concepts/locations?' + query,
            onSelect: this.addLocation.bind(this),
            onCreate: this.createMap.bind(this),
            createAllowed: (this.features === 'polygon') ? false : true,
            placeholderText: this.t.placeholder
        }).ref('authorSearchComponent');

        el.append(locationList);
        el.append(searchComponent);

        return el;
    }

    createMap(selectedItem, exists) {
        var properties = {
            newLocation: true,
            exists: exists,
            query: selectedItem.inputValue,
            reload: this.reload.bind(this),
            editable: true,
            plugin: this.props.plugin
        };

        // api.ui.showDialog(LocationDetailComponent, properties, {
        //     title: this.getLabel('Place'),
        //     global: true,
        //     primary: this.getLabel('Save')
        // })
    }

    addLocation(item) {
        // Use location "sub-type" as type for link
        var useGeometryType = api.getConfigValue(this.props.panel.id, 'useGeometryType');

        // Validate that writer config corresponds with concept backend config
        if (useGeometryType === true && !item.hasOwnProperty('geometryType')) {
            throw new Error('Writer configured to use geometry type for locations but no geometry type provided by concept backend');
        }

        var location = {
            title: item.name[0],
            uuid: item.uuid,
            data: item.location ? {position: item.location[0]} : {},
            type: useGeometryType ? item.geometryType[0] : 'x-im/place'
        };

        api.newsItem.addLocation(this.name, location)
        this.reload()
    }

    removeLocation(location) {
        api.newsItem.removeLinkByUUID(this.name, location.uuid);
        this.reload();
    }

    openMap(item) {
        var editable = true;
        if (item.concept.metadata.object['@type'] === 'x-im/polygon' && false === this.polygonIsEditable) {
            editable = false;
        }

        var properties = {
            newLocation: false,
            query: item.inputValue,
            location: item,
            reload: this.reload.bind(this),
            editable: editable,
            plugin: this.props.plugin
        };


        // api.showDialog(LocationDetailComponent, properties, {
        //     title: this.context.i18n.t('Place') + " " + item.concept.name,
        //     global: true,
        //     primary: editable ? this.context.i18n.t('Save') : this.context.i18n.t('Close'),
        //     secondary: editable ? this.context.i18n.t('Cancel') : false
        // })
    }

}

export default LocationMainComponent