import ArticlePartPackage from './ArticlePartPackage'
import {registerPlugin} from 'writer'

export default () => {
    if (registerPlugin) {
        registerPlugin(ArticlePartPackage)
    } else {
        console.error("Register method not yet available");
    }
}
