import {Component} from "substance"
import {UIFieldEditor, UIByline, UIToggle} from 'writer'
import ImageDisplay from "./ImageDisplay"
import ImageCropsPreview from "./ImageCropsPreview"

const {api} = writer

class XimimageComponent extends Component {


    constructor(...args) {
        super(...args)
        const alignment = api.getConfigValue('se.infomaker.ximimage', 'fields').find(field => field.name === "alignment");
        if (alignment && alignment.defaultValue) {
            if (!this.props.node.alignment && api.newsItem.hasTemporaryId()) {
                this.props.node.alignment = alignment.defaultValue
            }
        }
    }

    didMount() {
        this.props.node.fetchAuthorsConcept()
        this.context.editorSession.onRender('document', this._onDocumentChange, this)
    }

    dispose() {
        this.context.editorSession.off(this)
    }

    _onDocumentChange(change) {
        if (change.isAffected(this.props.node.id) ||
            change.isAffected(this.props.node.imageFile)) {
            if (this.refs.cropsPreview) {
                this.refs.cropsPreview.fetchCropUrls()
            }
            this.rerender()
        }
    }

    grabFocus() {
        let caption = this.refs.caption
        if (caption) {
            this.context.editorSession.setSelection({
                type: 'property',
                path: caption.getPath(),
                startOffset: 0,
                surfaceId: caption.id
            })
        }
    }

    render($$) {
        let node = this.props.node
        const imageDisplayMode = api.settings.get('se.infomaker.ximimage.settings', 'imageDisplayMode') || 'full'
        let el = $$('div').addClass(`sc-ximimage im-blocknode__container display-mode-${imageDisplayMode}`).ref('isolatedNodeContainer')

        let fields = api.getConfigValue('se.infomaker.ximimage', 'fields')
        let metaWrapper = $$('div').addClass('meta-wrapper').ref('metaWrapper')
        let cropsEnabled = api.getConfigValue('se.infomaker.ximimage', 'softcrop')
        let crops = api.getConfigValue('se.infomaker.ximimage', 'crops')
        let cropInstructions = api.getConfigValue('se.infomaker.ximimage', 'cropInstructions')
        let externalFlags = api.getConfigValue('se.infomaker.ximimage', 'externalFlags') || []

        // TODO: extract from full config when we can get that
        const imageOptions = ['byline', 'imageinfo', 'softcrop', 'crops', 'bylinesearch', 'hideDisableCropsCheckbox'].reduce((optionsObject, field) => {
            optionsObject[field] = api.getConfigValue('se.infomaker.ximimage', field)
            return optionsObject
        }, {})

        el.append(
            $$(ImageDisplay, {
                parentId: 'se.infomaker.ximimage',
                node,
                imageOptions,
                isolatedNodeState: this.props.isolatedNodeState,
                notifyCropsChanged: () => {
                    this.refs.cropsPreview.fetchCropUrls()
                }
            }).ref('image')
        )

        if (cropsEnabled && crops && cropInstructions) {
            el.append(
                $$(ImageCropsPreview, {
                    node,
                    crops,
                    cropInstructions,
                    isolatedNodeState: this.props.isolatedNodeState,
                }).ref('cropsPreview')
            )
        }

        metaWrapper.append(
            this._renderByline($$)
        )

        fields.forEach(obj => {
            if (obj.type === 'option') {
                metaWrapper.append(this.renderOptionField($$, obj))
            }
            else {
                metaWrapper.append(this.renderTextField($$, obj))
            }
        })

        if (externalFlags.length) {
            let flagWrapper = $$('div')
                .attr('contenteditable', false)
                .addClass('x-im-image-dynamic x-im-image-flags')
            externalFlags.forEach(obj => {
                flagWrapper.append(this.renderFlags($$, obj))
            })
            metaWrapper.append(flagWrapper)
        }

        el.append(metaWrapper)

        return el
    }

    get _showByline() {
        return api.getConfigValue('se.infomaker.ximimage', 'byline', true)
    }

    get _bylineSearchEnabled() {
        return this.context.api.getConfigValue('se.infomaker.ximimage', 'bylinesearch', true)
    }

    _renderByline($$) {
        if (this._showByline) {
            return $$(UIByline, {
                node: this.props.node,
                bylineSearch: this._bylineSearchEnabled,
                isolatedNodeState: this.props.isolatedNodeState
            }).ref('byline')
        }
    }

    renderTextField($$, obj) {
        return $$(UIFieldEditor, {
            node: this.props.node,
            field: obj.name,
            multiLine: false,
            disabled: Boolean(this.props.disabled),
            placeholder: obj.label,
            icon: this._getFieldIcon(obj.name) || 'fa-header'
        })
            .ref(obj.name)
            .attr('title', obj.label)
            .addClass('x-im-image-dynamic')
    }

    renderFlags($$, flag) {
        let isChecked = this.props.node.externalFlags.includes(flag.name) ? true : false
        return $$(UIToggle, {
            id: this.props.node.id + '_flag_' + flag.name,
            label: this.getLabel(flag.label),
            checked: isChecked,
            enabled: !this.props.disabled,
            onToggle: (checked) => {
                if (checked) {
                    this.props.node.externalFlags.push(flag.name)
                } else {
                    this.props.node.externalFlags = this.props.node.externalFlags.filter(extFlag => extFlag !== flag.name)
                }
                this.props.node.setExternalFlags(this.props.node.externalFlags)
            }
        })
    }

    _getFieldIcon(name) {
        const icons = {
            caption: 'fa-align-left',
            credit: 'fa-building-o',
            alttext: 'fa-low-vision'
        }

        return icons[name]
    }

    renderOptionField($$, obj) {
        let options = []

        obj.options.forEach(option => {
            let selectedClass = (this.props.node.alignment === option.name) ? ' selected' : ''

            options.push(
                $$('em')
                    .addClass('fa ' + option.icon + selectedClass)
                    .attr({
                        'contenteditable': 'false',
                        'title': option.label
                    })
                    .on('click', () => {
                        if (option.name !== this.props.node.alignment) {
                            this.props.node.setAlignment(option.name)
                            this.rerender()
                        }
                        return false
                    })
            );
        });

        return $$('div')
            .addClass('x-im-image-dynamic x-im-image-alignment')
            .attr({
                'contenteditable': 'false'
            })
            .append(options)
    }
}

export default XimimageComponent
