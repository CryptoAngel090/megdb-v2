/* Single CSS Module scope — merging multiple `*.module.css` via object spread breaks
 * when the same local class name exists in more than one file (last hash wins, base rules lost). */
import styles from './MovieDetailPage.module.css'

export default styles
