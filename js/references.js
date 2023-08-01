const zoteroId = '4306971'
const collection = 'XT9EWQJJ'
let receivedData = []
let sortBy = 'dateDesc'
let searchString = ''
let loading = false

let itemTypes = []

/** @type {ZetoroResp[]} */
let fetchedItems = []

const ZETORO_ID = '4306971'
const ZETORO_COLLECTION = 'XT9EWQJJ'
const ZETORO_LIMIT = 2000

/**
 * 
 * @param {string} input
 * @returns {string} 
 */
function deCamelCase(input){
    return input.replace(/[A-Z][a-z]+/g, s => ` ${s}`)
        .replace(/[A-Z][A-Z]+/, s => ` ${s}`)
        .split(" ")
        .map(word => word.length > 0
            ? `${word[0].toUpperCase()}${word.slice(1)}`
            : ''
        ).join(" ")
}

function referencesLoadingPrescript(){

    closeNav()
    fetchedItems = []

    loading = true
    document.getElementById('ref-search').disabled = true
    document.getElementById('search-button').disabled = true
    for (const el of Array.from(document.getElementsByClassName('check-box-types'))) {
        el.disabled = true
    }
    
    if (!document.getElementById('refLoader')) {
        const loadingPanel = document.getElementById('loading-panel')
        loadingPanel.insertAdjacentHTML('afterbegin', `<div id="refLoader" class="ref-loader"></div>`)
    }
    
    const listEls = document.getElementsByClassName("ref-list-el")
    for (const el of Array.from(listEls)) {
        el.remove()
    }
}

function referenceLoadingPostscript(){
    loading = true
    document.getElementById('ref-search').disabled = false
    document.getElementById('search-button').disabled = false
    for (const el of Array.from(document.getElementsByClassName('check-box-types'))) {
        el.disabled = false
    }
}

const enableLoading = () => {
    loading = true
    document.getElementById('ref-search').disabled = true
    document.getElementById('search-button').disabled = true
}

const disableLoading = () => {
    loading = true
    document.getElementById('ref-search').disabled = false
    document.getElementById('search-button').disabled = false
}

/**
 * @typedef {Object} ZetoroCreator
 * @property {string} creatorType
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} name
 */

/**
 * @typedef {Object} ZetoroTag
 * @property {string} tag
 * @property {number} type
 */

/**
 * @typedef {Object} ZetoroData
 * @property {string} key
 * @property {number} version
 * @property {string} itemType
 * @property {string} title
 * @property {ZetoroCreator[]} creators
 * @property {string} abstractNote
 * @property {string} publicationTitle
 * @property {string} volume
 * @property {string} issue
 * @property {string} pages
 * @property {string} date
 * @property {string} series
 * @property {string} seriesTitle
 * @property {string} seriesText
 * @property {string} journalAbbreviation
 * @property {string} language
 * @property {string} DOI
 * @property {string} ISSN
 * @property {string} shortTitle
 * @property {string} url
 * @property {string} accessDate
 * @property {string} archive
 * @property {string} archiveLocation
 * @property {string} libraryCatalog
 * @property {string} callNumber
 * @property {string} rights
 * @property {string} extra
 * @property {ZetoroTag[]} tags
 * @property {string[]} collections
 * @property {Object} relations
 * @property {string} dateAdded
 * @property {string} dateModified
 */

/**
 * @typedef {Object} Links
 * @property {string} href
 */

/**
 * @typedef {Object} ZetoroLinks
 * @property {Links} alternate
 * @property {Links} self
 */

/**
 * @typedef {Object} ZetoroLibrary
 * @property {number} id
 * @property {string} name
 * @property {string} type
 * @property {ZetoroLinks} links
 */

/**
 * @typedef {Object} ZetoroResp
 * @property {string} key
 * @property {number} version
 * @property {ZetoroData} data
 * @property {ZetoroLibrary} library
 * @property {ZetoroLinks} links
 */

/**
 * @typedef {Object} GroupedZetoroResp
 * @property {string} name
 * @property {ZetoroResp[]} items 
 */

/**
 * 
 * @param {('date'|'itemType')} sort 
 * @param {('asc'|'desc')} direction 
 * @param {string} queryString 
 * @param {string[]} itemType 
 * @returns {Promise<ZetoroResp[]>}
 */
async function _fetchReferences(sort="date", direction="desc", queryString, itemType) {
    const url = new URL(`https://api.zotero.org/groups/${ZETORO_ID}/collections/${ZETORO_COLLECTION}/items/top`)
    url.searchParams.set("format", "json")
    url.searchParams.set("limit", ZETORO_LIMIT)
    if (direction) {
        url.searchParams.set("direction", direction)
    }
    if (sort) {
        url.searchParams.set("sort", sort)
    }
    if (queryString) {
        url.searchParams.set("qmode", "everything")
        url.searchParams.set("q", queryString)
    }
    if (itemType) {
        url.searchParams.set("itemType", itemType.join(" || "))
    }
    const resp = await fetch (url)
    return await resp.json()
}

/**
 * 
 * @param {ZetoroResp[]} items 
 * @returns {GroupedZetoroResp[]}
 */
function groupReferences(items) {

    // Default order can be changed, but for now, is decided based on
    // meeting between PJ, Susanne and Xiao on 2023.07.27

    /** @type {GroupedZetoroResp[]} */
    const _ = [
        {
            name: "journalArticle",
            items: []
        },
        {
            name: "conferencePaper",
            items: []
        },
        {
            name: "preprint",
            items: []
        },
        {
            name: "thesis",
            items: []
        },
        {
            name: "presentation",
            items: []
        },
    ]
    for (const item of items) {
        const found = _.find(obj => obj.name === item.data.itemType)
        if (found) {
            found.items.push(item)
        } else {
            /** @type {GroupedZetoroResp} */
            const newItem = {
                name: item.data.itemType,
                items: [ item ]
            }
            _.push(newItem)
        }
    }
    return _
}


/**
 * 
 * @param {ZetoroCreator[]} creators
 * @returns {string[]}
 */
function formatCreatorsName(creators){
    if (creators.length > 5) {
        creators = [...creators.slice(0, 3), creators[creators.length - 1], {name: ' et al.'}] 
    }
    return creators
        .filter(c => !c.creatorType || c.creatorType === 'author'  || c.creatorType === 'presenter')
        .map(c => c.name? c.name :
            ` ${c.lastName && c.lastName} ${c.firstName && c.firstName
                .replace(/\./g,'').replace(/-/g, ' ').split(' ').map(n => n[0].toUpperCase()).join(' ')}`)
}


/**
 * 
 * @param {ZetoroResp[]} resp 
 */
function populateReferenceList(resp){
    
    const groupedRef = groupReferences(resp)
    const root = generateGroupedReferenceListRootElement(groupedRef)
    root.classList.add("ref-list-el")
    root.addEventListener("click", ev => {
        const key = ev.target?.dataset?.key
        if (key) {
            openSideNav(ev.target.dataset.key)
        }
    })

    document.getElementById('refLoader').remove()
    document.getElementById('reference-list').appendChild(root)
}

/**
 * 
 * @param {GroupedZetoroResp} groupedRef
 * @returns {HTMDivLElement} 
 */
function convertGroupedRefToNode(groupedRef) {

    // Create master container
    const root = document.createElement("div")
    root.classList.add("ref-section")

    // create header-anchor
    const headerAnchor = document.createElement("a")
    headerAnchor.id = `ref-section-${groupedRef.name}`

    // create header
    const header = document.createElement("h3")
    header.classList.add("ref-section-header")
    header.textContent = deCamelCase(groupedRef.name)

    // create content container
    const refsContainer = document.createElement("div")

    // create item containers
    const itemContainers = groupedRef.items.map((item, index, array) => {
        const _ = document.createElement("div")
        _.classList.add("reference", "julich-bar", "lt-grey-bg", "ref-item")
        _.dataset.key = item.key
        _.dataset.index = index

        // icon span
        const iconSpan = document.createElement("span")
        iconSpan.style.fontSize = "20px"
        iconSpan.textContent = item.data.itemType === 'journalArticle'? '📄' : item.data.itemType === 'thesis'? '🎓' : item.data.itemType === 'conferencePaper'? '📝' : item.data.itemType === 'report'? '📈' : item.data.itemType === 'preprint'? '📃' : '🖥'

        // author & year
        const authorString = formatCreatorsName(item.data.creators).join(", ")
        const yearString = item.data.date ? new Date( item.data.date ).getFullYear() : ''
        const authorYearNode = document.createTextNode(` ${authorString} ${yearString} `)

        // title span
        const titleSpan = document.createElement("span")
        titleSpan.classList.add("ref-title")
        titleSpan.textContent = `${item.data.title}.`

        // rest textnode
        const publicationTitle = item.data.publicationTitle
            ? `${item.data.publicationTitle},`
            : item.data.proceedingsTitle
                ? `${item.data.proceedingsTitle},`
                : '' 
        const university = item.data.university || ''
        const volume = item.data.volume || ''
        const issue = item.data.issue ? `(${item.data.issue})`: ``
        const pages = item.data.pages ? `${item.data.pages},` : ''
        const restTextNode = document.createTextNode(` ${publicationTitle} ${university} ${volume} ${issue} ${pages} `)

        // doi node
        let doiNode = null
        if (item.data.DOI){
            doiNode = document.createElement("a")
            doiNode.href = `https://doi.org/${item.data.DOI}`
            doiNode.target = "_blank"
            doiNode.textContent = item.data.DOI
        }

        // Put everything together
        _.appendChild(iconSpan)
        _.appendChild(authorYearNode)
        _.appendChild(titleSpan)
        _.appendChild(restTextNode)
        if (doiNode) {
            _.appendChild(doiNode)
        }
        
        return _
    })

    // Put everything together
    root.appendChild(headerAnchor)
    root.appendChild(header)
    root.appendChild(refsContainer)
    for (const item of itemContainers) {
        refsContainer.appendChild(item)
    }

    return root
}

/**
 * 
 * @param {GroupedZetoroResp[]} groupReferences 
 * @returns {HTMLDivElement}
 */
function generateGroupedReferenceListRootElement(groupReferences) {
    const _ = document.createElement("div")
    const groupedNodes = groupReferences.map( convertGroupedRefToNode )
    for (const el of groupedNodes) {
        _.appendChild(el)
    }
    return _
}

/**
 * 
 * @param {string} key 
 */
function openSideNav(key){
    const foundItem = fetchedItems.find(item => item.key === key)
    const ref = foundItem.data

    removeAttachedHtmls()
    
    fetchItemChildren(key)
    const panel = document.getElementById('ref-preview-panel')
    panel.style.width = '600px'

    const infoHtml = `<div id="ref-detail-info">
       <div class="flex-column">
        ${ref.itemType? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Type</div>
            <div class="ref-detail-row-value">${ref.itemType}</div>
        </div>` : ''}
        ${ref.title ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Title</div>
            <div class="ref-detail-row-value">${ref.title}</div>
        </div>` : ''}

        ${ref.creators ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">${ref.itemType === 'presentation'? 'Presenter' : 'Author'}${ref.creators.filter(c => c.creatorType && ['author', 'presenter'].includes(c.creatorType)).length > 1? 's' : ''}</div>
            <div class="ref-detail-row-value">${ref.creators.filter(c => !c.creatorType || ['author', 'presenter'].includes(c.creatorType)).map((c, i) => (c.firstName + ' ' + c.lastName)).join(', ')}</div>
        </div>` : ''}
        
        ${ref.creators && ref.creators.find(c => c.creatorType && c.creatorType === 'editor') ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Editor${ref.creators.filter(c => c.creatorType && c.creatorType === 'editor').length > 1? 's' : ''}</div>
            <div class="ref-detail-row-value">${ref.creators.filter(c => !c.creatorType || c.creatorType === 'editor').map((c, i) => (c.firstName + ' ' + c.lastName)).join(', ')}</div>
        </div>` : ''}

        ${ref.presentationType ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Presentation type</div>
            <div class="ref-detail-row-value">${ref.presentationType}</div>
        </div>` : ''}

        ${ref.reportType ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Report type</div>
            <div class="ref-detail-row-value">${ref.reportType}</div>
        </div>` : ''}

        ${ref.reportNumber ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Report number</div>
            <div class="ref-detail-row-value">${ref.reportNumber}</div>
        </div>` : ''}

        ${ref.institution ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Institution</div>
            <div class="ref-detail-row-value">${ref.institution}</div>
        </div>` : ''}

        ${ref.thesisType ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Thesys type</div>
            <div class="ref-detail-row-value">${ref.thesisType}</div>
        </div>` : ''}

        ${ref.university ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">University</div>
            <div class="ref-detail-row-value">${ref.university}</div>
        </div>` : ''}

        ${ref.meetingName ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Meeting name</div>
            <div class="ref-detail-row-value">${ref.meetingName}</div>
        </div>` : ''}

        ${ref.publicationTitle ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Publication</div>
            <div class="ref-detail-row-value">${ref.publicationTitle}</div>
        </div>` : ''}

        ${ref.volume ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Volume</div>
            <div class="ref-detail-row-value">${ref.volume}</div>
        </div>` : ''}

        ${ref.issue ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Issue</div>
            <div class="ref-detail-row-value">${ref.issue}</div>
        </div>` : ''}

        ${ref.pages ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Pages</div>
            <div class="ref-detail-row-value">${ref.pages}</div>
        </div>` : ''}

        ${ref.date ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Date</div>
            <div class="ref-detail-row-value">${ref.date}</div>
        </div>` : ''}

        ${ref.conferenceName ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Conference</div>
            <div class="ref-detail-row-value">${ref.conferenceName}</div>
        </div>` : ''}

        ${ref.proceedingsTitle ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Proceedings title</div>
            <div class="ref-detail-row-value">${ref.proceedingsTitle}</div>
        </div>` : ''}

        ${ref.place ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Place</div>
            <div class="ref-detail-row-value">${ref.place}</div>
        </div>` : ''}

        ${ref.series ?`<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Series</div>
            <div class="ref-detail-row-value">${ref.series}</div>
        </div>` : ''}

        ${ref.seriesTitle ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Serues title</div>
            <div class="ref-detail-row-value">${ref.seriesTitle}</div>
        </div>` : ''}

        ${ref.seriesText ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Series text</div>
            <div class="ref-detail-row-value">${ref.seriesText}</div>
        </div>` : ''}

        ${ref.journalAbbeviation ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Journal Abbr</div>
            <div class="ref-detail-row-value">${ref.journalAbbeviation}</div>
        </div>` : ''}

        ${ref.language ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Language</div>
            <div class="ref-detail-row-value">${ref.language}</div>
        </div>` : ''}

        ${ref.DOI ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">DOI</div>
            <div class="ref-detail-row-value">${`<a href="https://doi.org/${ref.DOI}" target="_blank">${ref.DOI}</a>`}</div>
        </div>` : ''}

        ${ref.ISSN ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">ISSN</div>
            <div class="ref-detail-row-value">${ref.ISSN}</div>
        </div>` : ''}

        ${ref.shortTitle ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Short title</div>
            <div class="ref-detail-row-value">${ref.shortTitle}</div>
        </div>` : ''}
        ${ref.url ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">URL</div>
            <div class="ref-detail-row-value">${`<a href="${ref.url}" target="_blank">${ref.url}</a>`}</div>
        </div>` : ''}

        <!--${ref.accessDate ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Accessed</div>
            <div class="ref-detail-row-value">${ref.accessDate}</div>
        </div>` : ''}-->

        ${ref.archive ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Archive</div>
            <div class="ref-detail-row-value">${ref.archive}</div>
        </div>` : ''}

        ${ref.archiveLocation ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Archive location</div>
            <div class="ref-detail-row-value">${ref.archiveLocation}</div>
        </div>` : ''}

        ${ref.libraryCatalog ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Library catalog</div>
            <div class="ref-detail-row-value">${ref.libraryCatalog}</div>
        </div>` : ''}

        ${ref.callNumber ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Call number</div>
            <div class="ref-detail-row-value">${ref.callNumber}</div>
        </div>` : ''}

        ${ref.rights ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Rights</div>
            <div class="ref-detail-row-value">${ref.rights}</div>
        </div>` : ''}

        ${ref.extra ? `<div class="flex lt-grey-bg ref-detail-row">
            <div class="ref-detail-row-key">Extra</div>
            <div class="ref-detail-row-value">${ref.extra}</div>
        </div>` : ''}

        ${ref.abstractNote ? `<div class="flex-column lt-grey-bg ref-detail-row">
            <span style="color: grey">Abstract</span>
            <span>${ref.abstractNote}</span>
        </div>` : ''}

      </div>
    </div>`

    selectRefTab('Info')
    document.getElementById('ref-preview-panel-info').insertAdjacentHTML('beforeend', infoHtml)



    const tagsTabEl = document.getElementById('Tags-button')

    if (ref.tags && ref.tags.length) {
        tagsTabEl.style.display = 'inline'
        const tagHtml = `<div id="ref-detail-tag" class="flex-column">
        ${ref.tags && ref.tags.length? ref.tags.map(tag =>
                (`<div class="ref-tag lt-grey-bg">${tag.tag}</div>`)).join('')
            : ''}
        </div>`

        document.getElementById('ref-preview-panel-tag').insertAdjacentHTML('beforeend', tagHtml)
    } else {
        tagsTabEl.style.display = 'none'
    }
}

/**
 * IIFE to populate itemtypes & populate initial list
 */
(async () => {

    referencesLoadingPrescript()

    fetchedItems = await _fetchReferences()
    populateReferenceList(fetchedItems)
    
    const searchInput = document.getElementById("ref-search")
    searchInput.addEventListener('search', onFilterCriteriaChange)
    searchInput.addEventListener("keyup", event => {
        if (event.key === 'Enter') {
            onFilterCriteriaChange()
        }
    })

    referenceLoadingPostscript()
})()

async function onFilterCriteriaChange(){

    referencesLoadingPrescript()

    const direction = "desc"
    const sort = "date"

    const searchString = document.getElementById('ref-search').value

    /** @type {HTMLCollectionOf<HTMLInputElement>} */
    const checkboxes = document.getElementsByClassName('check-box-types')
    const someUnchecked = Array.from(checkboxes).some(checkbox => !checkbox.checked)
    
    const filterByItemType = someUnchecked
        && Array.from(checkboxes)
        .filter(ch => ch.checked)
        .map(ch => ch.dataset.typeName)
    
    fetchedItems = await _fetchReferences(sort, direction, searchString, filterByItemType)
    populateReferenceList(fetchedItems)

    referenceLoadingPostscript()
}

const fetchItemChildren = (itemKey) => {
    fetch(`https://api.zotero.org/groups/${zoteroId}/items/${itemKey}/children?format=json&limit=2000`)
        .then(res => res.json())
        .then(data => {
            const selectedItemChildren = data.map(d => d.data)


            const notesTabEl = document.getElementById('Notes-button')
            notesTabEl.style.display = 'none'
            const attachmentsTabEl = document.getElementById('Attachments-button')
            attachmentsTabEl.style.display = 'none'

            const notesPanel = document.getElementById('ref-preview-panel-note')
            if (notesPanel) {
                const notes = selectedItemChildren.filter(i => i.itemType === 'note')
                if (notes.length) {
                    notesTabEl.style.display = 'inline'

                    const noteHtml = `<div id="ref-detail-note">${notes.map(n => (`<div class="ref-tag lt-grey-bg">${n.note}</div>`)).join('')}</div>`
                    notesPanel.insertAdjacentHTML('beforeend', noteHtml)
                }
            }

            const attachmentPanel = document.getElementById('ref-preview-panel-attachment')
            if(attachmentPanel) {
                const attachments = selectedItemChildren.filter(i => i.itemType === 'attachment')
                if (attachments.length) {
                    attachmentsTabEl.style.display = 'inline'
                    const attachmentHtml = `<div id="ref-detail-attachment">${attachments.map(a => (`<p><a href="${a.url}" target="_blank">${a.title} ${a.filename? `(${a.filename})` : ''}</a></p>`)).join('')}</div>`
                    attachmentPanel.insertAdjacentHTML('beforeend', attachmentHtml)
                }
            }

        })
        .catch(err => console.warn)
}

function closeNav(){
    removeAttachedHtmls()
    document.getElementById('ref-preview-panel').style.width = '0'
}

function removeAttachedHtmls(){
    const info = document.getElementById('ref-detail-info')
    if (info) info.remove()
    const tag = document.getElementById('ref-detail-tag')
    if (tag) tag.remove()
    const note = document.getElementById('ref-detail-note')
    if(note) note.remove()
    const attachment = document.getElementById('ref-detail-attachment')
    if(attachment) attachment.remove()
}

const selectRefTab = ( tab) => {
    let i
    let tabContent
    let tabLink

    tabContent = document.getElementsByClassName('tab-content')
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = 'none'
    }
    tabLink = document.getElementsByClassName('tab-link')
    for (i = 0; i < tabLink.length; i++) {
        tabLink[i].className = tabLink[i].className.replace(' active', '')
    }

    document.getElementById(tab).style.display = 'block'
    document.getElementById(tab+'-button').className += ' active'
}
