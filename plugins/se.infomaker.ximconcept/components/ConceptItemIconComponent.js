import { Component } from 'substance'

class ConceptItemIconComponent extends Component {

    getConceptTypeIcon(type) {
        const conceptTypeIcons = {
            'x-im/category': 'fa-folder',
            'x-im/tag': 'fa-tag',
            'x-im/person': 'fa-user',
            'x-im/contact-info': 'fa-user',
            'x-im/organisation': 'fa-sitemap',
            'x-im/content-profile': 'fa-cogs',

            'x-im/place': 'fa-map-marker',
            'x-im/position': 'fa-map-marker',
            'x-im/polygon': 'fa-map',

            'x-im/event': 'fa-map-marker',
            'x-im/author': 'fa-user',
            'x-im/story': 'fa-circle',

            'x-im/channel': 'fa-random',
            'x-im/topic': 'fa-tag',
            'x-im/section': 'fa-pie-chart',

            // TODO: Refactor this to use external config-file
            'x-cu/industry': 'fa-industry',
            'x-cu/responsibility': 'fa-calendar-check-o',
            'x-cu/project': 'fa-balance-scale',
            'x-cu/radio': 'fa-microphone'
        }

        return this.props.icon || conceptTypeIcons[type] || 'fa-question-circle-o'
    }

    getIconString() {
        return (this.props.isHovered && this.props.editable) ? 'fa-pencil' : this.getConceptTypeIcon(this.getItemConceptType())
    }

    getItemConceptType() {
        const {propertyMap} = this.props
        if (this.props.item[propertyMap.ConceptImTypeFull] === 'x-im/place') {
            return this.props.item[propertyMap.ConceptImSubTypeFull] ? this.props.item[propertyMap.ConceptImSubTypeFull] : this.props.item[propertyMap.ConceptImTypeFull]
        }

        return this.props.item[propertyMap.ConceptImTypeFull] || this.props.item.type
    }

    render($$){
        return $$('div', { class: 'concept-item-icon-wrapper' }, [
            $$('i', {
                "class": `fa ${this.getIconString()} concept-item-icon ${this.getItemConceptType()}`,
                "aria-hidden": "true"
            }).ref(`conceptIcon-${this.props.item.uuid}-icon`)
        ]).ref(`conceptIcon-${this.props.item.uuid}-wrapper`)
    }

}

export default ConceptItemIconComponent