import {Component, FontAwesomeIcon} from 'substance'
import Popover from './Popover'

class NoConnection extends Component {

    shouldRerender() {
        return false
    }

    openPopover() {
        this.refs.popover.open()
    }

    closePopover() {
        this.refs.popover.close()
    }

    togglePopover() {
        this.refs.popover.toggle()
    }

    render($$) {
        return $$('div', { class: 'no-connection-container' }, [
            $$('button', { class: 'btn no-connection' }, [
                $$(FontAwesomeIcon, {icon: 'fa-chain-broken'}),
                $$('span', { class: 'description' }, this.getLabel('uatracker-no-connetion'))
            ]).on('click', this.togglePopover.bind(this)),
            this._renderPopover($$)
        ])
    }

    _renderPopover($$) {
        return $$(Popover, {
            sticky: false,
            content: $$('div', { class: 'no-connection popover-content' }, [
                $$('div', { class: 'content' }, [
                    $$('h2', { class: 'heading' },
                        this.getLabel('no-connection-headline')
                    ),
                    $$('div', { class: 'message' },
                        this.getLabel('no-connection-description')
                    )
                ])
            ])
        }).ref('popover')
    }
}

export default NoConnection
