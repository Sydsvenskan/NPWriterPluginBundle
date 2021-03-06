import { Component } from 'substance'
import { UIDropdown } from 'writer'

class SelectMainChannelComponent extends Component {

    /**
     * Create dropdown for Main channel
     *
     * @param {object} $$ VirtualElement
     */
    renderChannelsDropDown($$) {
        const mainChannel = this.props.articleChannels.find(articleChannel => articleChannel.rel === 'mainchannel')
        const options = [
            { label: this.getLabel('Set main channel'), value: '' },
            ...this.props.channels.map(channel => ({ label: channel[this.props.propertyMap.ConceptName], value: channel.uuid }))
        ]

        return $$(UIDropdown, {
            header: '',
            options: options,
            isSelected: (options, channel) => {
                return (mainChannel !== undefined && mainChannel.uuid === channel.value)
            },
            onChangeList: (selected) => {
                const selectedChannel = this.props.channels.find(channel => channel.uuid === selected)

                if (selectedChannel) {
                    if (!mainChannel || (selectedChannel.uuid !== mainChannel.uuid)) {
                        const existingArticleChannel = this.props.articleChannels.find(channel => channel.uuid === selectedChannel.uuid)

                        this.props.articleChannels.forEach(articleChannel => {
                            if (articleChannel.uuid !== selectedChannel.uuid) {
                                articleChannel.rel = 'channel'
                                this.props.updateArticleChannelRel(articleChannel)
                            }
                        })

                        selectedChannel.rel = 'mainchannel'
                        if (existingArticleChannel) {
                            this.props.updateArticleChannelRel(selectedChannel)
                        } else {
                            this.props.addChannelToArticle(selectedChannel)
                        }
                    }
                } else {
                    if (mainChannel) {
                        this.props.removeChannelFromArticle(mainChannel)
                    }
                }
            },
            disabled: this.props.channels.length < 1
        }).ref('sortingsDropDown')
    }

    render($$){
        return $$('div', { class: 'main-channel-component' }, this.renderChannelsDropDown($$))
    }

}

export default SelectMainChannelComponent
