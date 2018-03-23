import { AnnotationComponent } from 'substance'

export default (tagName, color) => {
    class MarkerComponent extends AnnotationComponent {

        getTagName() {
            return tagName
        }

        render($$) {
            let el = $$(this.getTagName())
                .attr("data-id", this.props.node.id)
                .addClass(this.getClassNames())

            if (color) {
                el.attr('style', `background-color: ${color}`)
            }

            if (this.props.node.highlighted) {
                el.addClass('sm-highlighted')
            }

            el.append(this.props.children)
            return el
        }
    }

    return MarkerComponent
}
