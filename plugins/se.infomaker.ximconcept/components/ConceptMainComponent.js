import {Component} from "substance"
import { api, ConceptService, event } from 'writer'
import ConceptListComponent from './ConceptListComponent'
import ConceptSearchComponent from "./ConceptSearchComponent";
import ConceptDialogComponent from './ConceptDialogComponent'
import ConceptItemModel from '../models/ConceptItemModel'
import ConceptSelectTypeComponent from './ConceptSelectTypeComponent'

class ConceptMainComponent extends Component {

    constructor(...args) {
        super(...args)

        this.addItem = this.addItem.bind(this)
        this.editItem = this.editItem.bind(this)
        this.removeArticleConcept = this.removeArticleConcept.bind(this)
        this.addConceptToArticle = this.addConceptToArticle.bind(this)
        this.updateArticleConcept = this.updateArticleConcept.bind(this)
        this.itemExists = this.itemExists.bind(this)
    }

    didMount() {
        ConceptService.on(
            this.state.conceptType,
            ConceptService.operations.ADD,
            this.addItem
        )

        if (this.state.types) {
            this.state.types.forEach(type => ConceptService.on(type, ConceptService.operations.ADD, this.addItem))
        }

        api.events.on(this.props.pluginConfigObject.id, event.DOCUMENT_CHANGED, async (e) => {
            const types = this.state.types || []
            const eventName = e.name || ''
            const cleanEventName = eventName.replace('-', '').replace('/', '')
            const associatedWith = (this.state.pluginConfig.associatedWith || '').replace('-', '').replace('/', '')
            const matchingType = types.map(type => type.replace('-', '').replace('/', '')).find(type => (type === eventName || type === cleanEventName))

            if (eventName.length) {
                if (e.data.action === 'delete' && (associatedWith.length && associatedWith === eventName)) {
                    const eventUUID = e.data.node.uuid
                    this.state.existingItems.forEach(existingItem => {
                        const itemAssociatedWith = existingItem[this.state.propertyMap.ConceptAssociatedWith]

                        // if no multi-value (just one associated-with) and its a match, we remove the item
                        if (itemAssociatedWith === eventUUID) {
                            ConceptService.removeArticleConceptItem(existingItem)
                        }

                        // if we have multiple associated-with we need to check 'em all to look for a match
                        if (Array.isArray(itemAssociatedWith)) {
                            let associationExists = false

                            itemAssociatedWith.forEach(itemAssociatedWithUuid => {
                                if (ConceptService.getArticleConceptByUUID(itemAssociatedWithUuid)) {
                                    associationExists = true
                                }
                            })

                            if (!associationExists) {
                                ConceptService.removeArticleConceptItem(existingItem)
                            }
                        }
                    })
                } else if (e.data.action === 'delete-all' && (associatedWith.length && associatedWith === eventName)) {
                    ConceptService.removeAllArticleLinksOfType(this.state.conceptType)
                } else if (eventName === this.state.name || cleanEventName === this.state.name || matchingType) {
                    const updatedConcept = (e.data && e.data.data) ? e.data.data : null
                    this.reloadArticleConcepts(updatedConcept)
                } else if (associatedWith.length && associatedWith === eventName) {
                    const { pluginConfig } = this.state
                    const associatedLinks = ConceptService.getArticleConceptsByType(pluginConfig.associatedWith)

                    this.extendState({ associatedLinks })
                }
            }
        })

        api.events.on(this.props.pluginConfigObject.id, event.DOCUMENT_CHANGED_EXTERNAL, (e) => {
            if (e.data.key === 'itemMetaLink') {
                if (this.state.conceptType === e.data.value.type) {
                    this.reloadArticleConcepts()
                }
            }
        })
    }


    dispose() {
        ConceptService.off(this.state.conceptType, ConceptService.operations.ADD, this.addItem)

        if (this.state.types) {
            this.state.types.forEach(type => ConceptService.off(type, ConceptService.operations.ADD, this.addItem))
        }

        api.events.off(this.props.pluginConfigObject.id, event.DOCUMENT_CHANGED)
        api.events.off(this.props.pluginConfigObject.id, event.DOCUMENT_CHANGED_EXTERNAL)
    }

    /**
     * reload concepts from article
     *
     * @param {object} updatedConcept optional object that triggered document changed event, defaults to null
     */
    reloadArticleConcepts(updatedConcept = null) {
        const { pluginConfig } = this.state
        const existingItems = ConceptService.getArticleConceptsByType(this.state.conceptType, this.state.types, this.state.subtypes)
        const associatedLinks = pluginConfig.associatedWith ? ConceptService.getArticleConceptsByType(pluginConfig.associatedWith) : false

        this.extendState({ associatedLinks })

        this.decorateExistingItemsWithRemoteMeta(existingItems, updatedConcept)
    }

    getInitialState() {
        const pluginConfig = this.props.pluginConfigObject.pluginConfigObject.data
        const conceptType = pluginConfig.name
        const rel = pluginConfig.rel
        const name = conceptType.replace('-', '').replace('/', '')
        const types = Object.keys(pluginConfig.types || {})
        const subtypes = pluginConfig.subtypes
        const articleConcepts = ConceptService.getArticleConceptsByType(conceptType, types, subtypes)
        const propertyMap = ConceptService.getPropertyMap()
        const associatedLinks = pluginConfig.associatedWith ? ConceptService.getArticleConceptsByType(pluginConfig.associatedWith) : false
        const existingItems = []

        this.decorateExistingItemsWithRemoteMeta(articleConcepts)

        return {
            name,
            rel,
            pluginConfig,
            types,
            subtypes,
            existingItems,
            conceptType,
            propertyMap,
            associatedLinks
        }
    }

    /**
     * Fetch additional data from OC for each concept
     * Will check if item already has been decorated before fetch
     *
     * @param {array} existingItems array with concepts from the article
     * @param {object} updatedConcept optional object that triggered document changed event, defaults to null
     */
    async decorateExistingItemsWithRemoteMeta(existingItems, updatedConcept) {
        const decoratedItems = await Promise.all(existingItems.map(async (item) => {
            const existingItem = this.state ?
                this.state.existingItems.find(({ uuid }) => uuid === item.uuid) :
                false

            if ((updatedConcept && existingItem) && updatedConcept.uuid === existingItem.uuid) {
                existingItem.isEnhanced = false
            }

            if (existingItem && existingItem.isEnhanced) {
                item = existingItem
            } else {
                item = await ConceptService.fetchConceptItemProperties(item)
                item.isEnhanced = true
            }

            return item
        }))

        this.extendState({ existingItems: decoratedItems })
    }

    async addConceptToArticle(item) {
        item = await (new ConceptItemModel(item, this.state.pluginConfig, this.state.propertyMap)).extractConceptArticleData(item)

        if (!item.errors) {

            if (this.state.rel) {
                item.rel = this.state.rel
            }
            ConceptService.addArticleConcept(item)
        } else {
            api.ui.showNotification(
                this.state.name,
                this.getLabel('Invalid Concept'),
                item.errors.reduce((iterator, error) => { return `${iterator}${iterator.length ? ', ' : ''}${error.error}`}, '')
            )
        }
    }

    updateArticleConcept(item) {
        ConceptService.updateArticleConcept(item)
    }

    removeArticleConcept(item) {
        ConceptService.removeArticleConceptItem(item)
    }

    async addItem(item) {
        if (item && item.uuid) {
            if (!this.itemExists(item)) {
                this.extendState({ 'working': true })
                await this.addConceptToArticle(item)
                this.extendState({ 'working': false })
            } else {
                api.ui.showNotification(
                    this.state.name,
                    this.getLabel('Concept item exists'),
                    this.getLabel('This Concept is already used'))
            }
        } else {
            if (this.state.pluginConfig.createable || this.state.pluginConfig.editable) {
                const conceptType = item[[this.state.propertyMap.ConceptImTypeFull]] ? item[this.state.propertyMap.ConceptImTypeFull] :
                    this.state.types.length ? null : this.state.conceptType

                this.editItem({
                    ...item,
                    [this.state.propertyMap.ConceptImTypeFull]: conceptType
                })
            }
        }
    }

    itemExists(item) {
        const existingItem = this.state.existingItems.find(i => i.uuid === item.uuid)

        return (existingItem !== undefined)
    }

    editItem(item) {
        const title = `${item.create ? this.getLabel('Create') : ''} ${this.state.pluginConfig.label}: ${item[this.state.propertyMap.ConceptName] ? item[this.state.propertyMap.ConceptName] : ''}`

        if (this.state.pluginConfig.types && !item[this.state.propertyMap.ConceptImTypeFull]) {
            api.ui.showDialog(
                ConceptSelectTypeComponent,
                {
                    item,
                    propertyMap: this.state.propertyMap,
                    config: this.state.pluginConfig,
                    typeSelected: this.editItem
                },
                {
                    title,
                    cssClass: 'hide-overflow',
                    primary: false,
                    secondary: this.getLabel('Cancel'),
                }
            )
        } else {
            api.ui.showDialog(
                ConceptDialogComponent,
                {
                    item,
                    propertyMap: this.state.propertyMap,
                    config: this.state.pluginConfig,
                    save: (item && item.create) ? this.addConceptToArticle : this.updateArticleConcept,
                },
                {
                    title,
                    cssClass: 'hide-overflow',
                    primary: this.getLabel('Save'),
                    secondary: this.getLabel('Cancel'),
                }
            )
        }
    }

    shouldBeDisabled() {
        const { singleValue, pluginConfig, associatedLinks } = this.state

        return (singleValue && this.state.existingItems.length) ? true :
            (pluginConfig.associatedWith && (!associatedLinks || !associatedLinks.length)) ? true : false
    }

    render($$) {
        let search
        const config = this.state.pluginConfig || {}
        const { label, enableHierarchy, placeholderText, singleValue, creatable, editable, subtypes, associatedWith, icon } = config
        const { propertyMap } = this.state
        const { conceptType, types } = this.state || {}
        const header = $$('h2', { class: 'concept-header' }, [
            `${label} (${this.state.existingItems.length})`
        ])
        const list = $$(ConceptListComponent, {
            propertyMap,
            editItem: this.editItem,
            removeItem: this.removeArticleConcept,
            existingItems: this.state.existingItems,
            working: this.state.working,
            enableHierarchy,
            editable,
            icon,
            types: config.types
        }).ref(`conceptListComponent-${this.state.name}`)

        if (!singleValue || !this.state.existingItems.length) {
            search = $$(ConceptSearchComponent, {
                propertyMap,
                placeholderText,
                conceptTypes: types.length ? types : conceptType,
                subtypes,
                creatable: (creatable !== undefined) ? creatable : editable,
                enableHierarchy,
                disabled: this.shouldBeDisabled(),
                addItem: this.addItem,
                itemExists: this.itemExists,
                associatedWith,
                icon,
                types: config.types
            }).ref(`conceptSearchComponent-${this.state.name}`)
        }

        return $$('div', { class: `concept-main-component ${conceptType}` }, [
            header,
            list,
            search
        ]).ref(`conceptMainComponent-${this.state.name}`)
    }
}

export default ConceptMainComponent
