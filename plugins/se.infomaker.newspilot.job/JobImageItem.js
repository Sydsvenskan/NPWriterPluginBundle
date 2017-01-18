import {Component, FontAwesomeIcon} from 'substance'

class JobImageItem extends Component {

    getInitialState() {
        // TODO:
    }

    didMount() {
        // TODO:
    }

    render($$) {
        const jobImage = this.props.jobImage

        const divBox = $$('div').addClass('box')

        const ul = $$('ul')

        const listDrag = $$('li').addClass('drag')
            .attr('draggable', true)
            .on('dragstart', this._onDragStart, this)
            .html(this._getSvg())

        const listContent = $$('li').addClass('content')

        const icon = $$('img')
            .attr('src', jobImage.url)
            .addClass('image-icon')

        const label = $$('span')
            .addClass('title')
            .append(jobImage.name)

        listContent.append([label, icon])

        ul.append([listDrag, listContent])

        divBox.append(ul)

        return divBox
    }

    _onDragStart(e) {
        e.stopPropagation()
        e.dataTransfer.setData('text/uri-list', this.props.jobImage.url)
    }

    _getSvg() {
        return '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve"> <g> <rect x="7.9" y="1" class="st0" width="2.8" height="22"/> <rect x="13.4" y="1" class="st0" width="2.8" height="22"/> </g> </svg>'
    }
}

export default JobImageItem
