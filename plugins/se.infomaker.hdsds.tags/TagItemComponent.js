import {Component, FontAwesomeIcon as Icon} from 'substance'
import {jxon, lodash as _, UITooltip} from 'writer'
import Config from './config/Config'
import TagInfoComponent from './TagInfoComponent'
import TagEditCompanyComponent from './TagEditCompanyComponent'
import TagEditPersonComponent from './TagEditPersonComponent'

class TagsItemComponent extends Component {

    constructor(...args) {
        super(...args)
        this.name = 'hdsdstags'
    }


    /**
     * Get itemMetaExtension property in itemMeta section.
     * @param type
     * @returns {*}
     */
    getItemMetaExtPropertyByType(type) {
        if (_.isArray(this.state.loadedTag.itemMeta.itemMetaExtProperty)) {
            return _.find(this.state.loadedTag.itemMeta.itemMetaExtProperty, function (itemMeta) {
                return itemMeta['@type'] === type;
            })
        } else if (_.isObject(this.state.loadedTag.itemMeta.itemMetaExtProperty)) {
            if (this.state.loadedTag.itemMeta.itemMetaExtProperty['@type'] === type) {
                return this.state.loadedTag.itemMeta.itemMetaExtProperty;
            }
        }
    }

    loadTag() {
        this.context.api.router.getConceptItem(this.props.tag.uuid, this.props.tag.type)
            .then(xml => {
                const conceptXML = xml.querySelector('conceptItem'),
                    conceptItemJSON = jxon.build(conceptXML)

                this.extendState({
                    loadedTag: conceptItemJSON,
                    isLoaded: true
                })

                //Add tagType to loaded tag
                this.state.loadedTag.type = this.getItemMetaExtPropertyByType('imext:type');
            })
            .catch(() => {
                this.extendState({
                    isLoaded: true,
                    couldNotLoad: true
                })
            })
    }


    render($$) {
        const tag = this.props.tag,
            tagItem = $$('li').addClass('tag-list__item').ref('tagItem'),
            displayNameEl = $$('span')

        let displayName

        displayNameEl.attr('title', TagsItemComponent.getNameForTag(tag));

        if (!this.state.isLoaded) {
            this.loadTag()
        } else {
            if (this.state.couldNotLoad) {
                displayNameEl.addClass('tag-item__title tag-item__title--no-avatar tag-item__title--notexisting')
                    .append(tag.title)
                    .attr('title', this.getLabel('hdsds-tagscould_not_load_uuid') + tag.uuid)
                displayName = tag.title
            } else {
                displayName = this.state.loadedTag.concept.name
                displayNameEl.addClass('tag-item__title tag-item__title--no-avatar').append(displayName)
                const title = this.updateTagItemName(displayNameEl, this.state.loadedTag)

                // displayNameEl.attr('title', title);

                displayNameEl.on('click', () => {
                    // $(ev.target).tooltip('hide');
                    if (Config.isTagEditable(tag)) {
                        this.editTag(displayName)
                    } else {
                        this.showTag(displayName)
                    }
                })
                    .append($$(UITooltip, {title: title ? title : displayName, parent: this}).ref('tooltip'))
            }


            displayNameEl.on('mouseenter', () => {
                this.refs.tooltip.extendProps({
                    show: false
                })
            })
            displayNameEl.on('mouseout', () => {
                this.refs.tooltip.extendProps({
                    show: true
                })
            })

            tagItem.append(displayNameEl)

            const deleteButton = $$('span').append($$(Icon, {icon: 'fa-times'})
                .addClass('tag-icon tag-icon--delete')
                .attr('title', this.getLabel('hdsds-tagsRemove_from_article')))
                .on('click', () => {
                    this.removeTag(tag)
                })

            tagItem.append(deleteButton)
            const iconComponent = this.getIconForTag($$, tag)
            if (iconComponent) {
                tagItem.append(iconComponent)
            }
        }
        return tagItem
    }

    showTag(title) {
        this.context.api.ui.showDialog(TagInfoComponent,
            {
                tag: this.state.loadedTag,
                close: this.closeFromDialog.bind(this),
                couldNotLoad: this.state.couldNotLoad
            },
            {
                secondary: false,
                title: title,
                global: true
            })
    }

    /**
     * Shows a edit component in dialoag
     * @param title
     */
    editTag(title) {
        let tagEdit;

        switch (this.state.loadedTag.type['@value']) {
            case 'x-im/organisation':
                tagEdit = TagEditCompanyComponent
                break;
            case 'x-im/person':
                tagEdit = TagEditPersonComponent
                break;
            default:
                break;
        }

        this.context.api.ui.showDialog(tagEdit,
            {
                tag: this.state.loadedTag,
                close: this.closeFromDialog.bind(this),
                couldNotLoad: this.state.couldNotLoad
            },
            {
                primary: this.getLabel('hdsds-tagssave'),
                title: this.getLabel('hdsds-tagsedit') + " " + title,
                global: true
            })
    }

    /**
     * Called when edit and info dialog is closed
     */
    closeFromDialog() {
        this.loadTag() // Reload new changes
        this.props.reload()
    }

    /**
     * Remove tag after fading item away
     * @param tag
     */
    removeTag(tag) {
        this.props.removeTag(tag);
    }

    getIconForTag($$, tag) {
        if (!tag.type) {
            return this.getDefaultIconForTag($$);
        }

        const tagConfig = Config.types[tag.type];
        if (tagConfig) {
            return $$(Icon, {icon: tagConfig.icon}).addClass('tag-icon');
        } else {
            this.getDefaultIconForTag($$);
        }
    }

    static getNameForTag(tag) {
        if (!tag.type) {
            return undefined;
        }
        const tagConfig = Config.types[tag.type];
        if (tagConfig) {
            return tagConfig.name;
        }
    }

    updateTagItemName(tagItem, loadedTag) {
        if (loadedTag.concept && loadedTag.concept.definition) {
            const definition = _.isArray(loadedTag.concept.definition) ? loadedTag.concept.definition : [loadedTag.concept.definition];
            for (let i = 0; i < definition.length; i++) {
                const item = definition[i];
                if (item["@role"] === "drol:short") {
                    if (item["keyValue"] && item["keyValue"].length > 0) {

                        return item["keyValue"]
                    }
                }
            }
        }
    }

    getDefaultIconForTag($$) {
        return $$(Icon, {icon: 'fa-tag'}).addClass('tag-icon')
    }

}


export default TagsItemComponent
