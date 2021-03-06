import './scss/newspriority.scss'
import NewsPriorityComponent from './NewsPriorityComponent'

export default {
    name: 'newspriority',
    id: 'se.infomaker.newspriority',
    version: '{{version}}',
    configure: function (config, pluginConfig) {

        config.addToSidebar('main', pluginConfig, NewsPriorityComponent)

        config.addLabel('newsvalue', {
            en: 'News value',
            sv: 'Nyhetsvärde'
        })
        config.addLabel('Lifetime', {
            en: 'Lifetime',
            sv: 'Livslängd'
        })
        config.addLabel('enter-date-and-time', {
            en: 'Enter date and time',
            sv: 'Ange datum och tid'
        })
    }
}
