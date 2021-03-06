import {Component} from 'substance'
import {api, event, jxon, UIFormSearch} from 'writer'
import TagsList from './TagsListComponent'
import TagEditBaseComponent from './TagEditBaseComponent'
import TagEditPersonComponent from './TagEditPersonComponent'
import TagEditCompanyComponent from './TagEditCompanyComponent'
import TagEditTopicComponent from './TagEditTopicComponent'
import TagsTemplate from './template/concept'
import Config from './config/Config'

const pluginId = 'se.infomaker.ximtags';

class TagsMainComponent extends Component {


    constructor(...args) {
        super(...args)
        this.name = 'ximtags'


        const tagsConfig = api.getConfigValue(
            pluginId,
            'tags'
        )
        this.config = new Config(tagsConfig)

        api.events.on(pluginId, event.DOCUMENT_CHANGED, (data) => {
            this._onDocumentChanged(data)
        })
    }

    _onDocumentChanged(data) {
        if (data.data && data.data.node) {
            if (data.data.node.rel === 'subject') {
                this.reload()
            }
        }
    }

    getInitialState() {
        return {
            existingTags: this.context.api.newsItem.getTags(this.getTags())
        }
    }

    reload() {
        this.extendState({
            existingTags: this.context.api.newsItem.getTags(this.getTags())
        })
    }

    render($$) {

        const el = $$('div').ref('tagContainer').addClass('authors').append($$('h2').append(this.getLabel('ximtags-title')))

        const searchComponent = $$(UIFormSearch, {
            existingItems: this.state.existingTags,
            searchUrl: '/api/search/concepts/tags?q=',
            onSelect: this.addTag.bind(this),
            onCreate: this.createTag.bind(this),
            placeholderText: this.getLabel('ximtags-search_placeholder'),
            createAllowed: true
        }).ref('searchComponent')

        const tagList = $$(TagsList, {
            tags: this.state.existingTags,
            removeTag: this.removeTag.bind(this),
            reload: this.reload.bind(this)
        }).ref('tagList')

        el.append(tagList)
        el.append(searchComponent)

        return el

    }

    /**
     * @param tag
     */
    removeTag(tag) {
        try {
            this.context.api.newsItem.removeLinkByUUIDAndRel(this.name, tag.uuid, 'subject')
            this.reload()
        }
        catch (e) {
            // FIXME: Implement exception handling
        }
    }

    addTag(tag) {
        try {
            if (this.isValidTag(tag)) {
                this.context.api.newsItem.addTag(this.name, tag)
                this.reload()
            }
        }
        catch (e) {
            // FIXME: Implement exception handling
        }
    }

    /**
     * Only handles create new 'person', 'organisation' or 'topic'.
     *
     * @param tag
     * @param exists
     */
    createTag(tag, exists) {
        try {
            if (this.canCreateTag()) {
                this.context.api.ui.showDialog(TagEditBaseComponent, {
                    tag: tag,
                    exists: exists,
                    close: this.closeFromDialog.bind(this),
                    createPerson: this.createPerson.bind(this),
                    createOrganisation: this.createOrganisation.bind(this),
                    createTopic: this.createTopic.bind(this),
                    tagsConfig: api.getConfigValue(pluginId, 'tags')
                }, {
                    primary: false,
                    title: this.getLabel('ximtags-create') + " " + tag.inputValue,
                    global: true
                })
            }
        }
        catch (e) {
            // FIXME: Implement exception handling
        }
    }


    createPerson(inputValue) {
        const newName = inputValue.split(' ')

        const parser = new DOMParser();
        const tagXML = parser.parseFromString(TagsTemplate.personTemplate, 'text/xml').firstChild

        const firstname = newName.shift()
        const lastName = newName.join(' ')
        // Prepopulate the TAG with user input from form
        tagXML.querySelector('itemMeta itemMetaExtProperty[type="imext:firstName"]').setAttribute('value', firstname)
        tagXML.querySelector('itemMeta itemMetaExtProperty[type="imext:lastName"]').setAttribute('value', lastName)

        const loadedTag = jxon.build(tagXML)

        this.context.api.ui.showDialog(TagEditPersonComponent, {
            tag: loadedTag,
            close: this.closeFromDialog.bind(this)
        }, {
            primary: this.getLabel('ximtags-save'),
            title: this.getLabel('ximtags-create') + " " + inputValue,
            icon: 'fa-user',
            global: true
        })
    }

    createOrganisation(inputValue) {

        const parser = new DOMParser();
        const tagXML = parser.parseFromString(TagsTemplate.organisationTemplate, 'text/xml').firstChild

        // Prepopulate the TAG with user input from form
        tagXML.querySelector('concept name').textContent = inputValue
        const loadedTag = jxon.build(tagXML)

        this.context.api.ui.showDialog(TagEditCompanyComponent, {
            tag: loadedTag,
            close: this.closeFromDialog.bind(this)
        }, {
            primary: this.getLabel('ximtags-save'),
            title: this.getLabel('ximtags-create') + " " + inputValue,
            icon: 'fa-sitemap',
            global: true
        })
    }

    createTopic(inputValue) {
        const parser = new DOMParser();
        const tagXML = parser.parseFromString(TagsTemplate.topicTemplate, 'text/xml').firstChild

        // Prepopulate the TAG with user input from form
        tagXML.querySelector('concept name').textContent = inputValue
        const loadedTag = jxon.build(tagXML)

        this.context.api.ui.showDialog(TagEditTopicComponent, {
            tag: loadedTag,
            close: this.closeFromDialog.bind(this)
        }, {
            primary: this.getLabel('ximtags-save'),
            title: this.getLabel('ximtags-create') + " " + inputValue,
            icon: 'fa-tags',
            global: true
        })

    }

    closeFromDialog() {
        this.reload()
    }

    isValidTag(tag) {
        if (tag.imType && tag.imType[0]) {
            return this.getTags().indexOf(tag.imType[0]) > -1
        }
        return false
    }

    getTags() {
        const tagConfigs = api.getConfigValue(
            pluginId,
            'tags'
        )

        if (tagConfigs) {
            return Object.keys(tagConfigs)
        } else {
            throw new Error('Missing tags configuration for ximtags plugin')
        }
    }

    /**
     * Checks configured tag configuration. If any of the configured tags is
     * editable, true is returned.
     *
     * @return {boolean}
     */
    canCreateTag() {
        const tags = this.getTags()
        let canCreate = false

        tags.forEach((tag) => {
            if (this.config.getTagConfigByType(tag).editable) {
                canCreate = true
            }
        })

        return canCreate
    }
}

export default TagsMainComponent
