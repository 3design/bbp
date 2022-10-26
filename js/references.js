const zoteroId = '4306971'
const collection = 'XT9EWQJJ'
let receivedData = []
let sortBy = 'dateDesc'
let searchString = ''
let loading = false

const enableLoading = () => {
    loading = true
    document.getElementById('sort-ref').disabled = true
    document.getElementById('ref-search').disabled = true
    document.getElementById('search-button').disabled = true
}

const disableLoading = () => {
    loading = true
    document.getElementById('sort-ref').disabled = false
    document.getElementById('ref-search').disabled = false
    document.getElementById('search-button').disabled = false
}

setTimeout(() => {
    const searchInput = document.getElementById("ref-search")
    searchInput.addEventListener('search', evt => search())
    searchInput.addEventListener("keyup", event => {
        if (event.key === 'Enter') {
            search()
        }
    })
})


const fetchReferences = ({sort = null, direction= null, queryString = null} = {}) => {
    if (!sort && !direction) {
        if (sortBy.includes('Desc')) {
            sort = sortBy.replace('Desc', '')
            direction = 'desc'
        } else {
            sort = sortBy.replace('Asc', '')
            direction = 'asc'
        }
    }
    if (!queryString) {
        queryString = searchString
    }

    setTimeout(() => {
        if (!document.getElementById('refLoader')) {
           const loadingPanel = document.getElementById('loading-panel')
           loadingPanel.insertAdjacentHTML('afterbegin', `<div id="refLoader" class="ref-loader"></div>`)
        } 
        enableLoading()
    }, 100)

    const listEl = document.getElementById('ref-list-el')
    if(listEl) listEl.remove()


    fetch(`https://api.zotero.org/groups/${zoteroId}/collections/${collection}/items/top?format=json&limit=2000
                    &direction=${direction}&sort=${sort}` + (queryString? `&qmode=everything&q=${queryString}` : ''))
        .then(res => res.json())
        .then(data => {

            const getCreatorName = (creators) => {

                return creators
                    .filter(c => !c.creatorType || c.creatorType === 'author')
                    .map(c => c.name? c.name :
                        ` ${c.lastName && c.lastName} ${c.firstName && c.firstName
                            .replace(/\./g,'').replace(/-/g, ' ').split(' ').map(n => n[0].toUpperCase()).join(' ')}`)
            }

            disableLoading()
            receivedData = data.map(d => d.data)

            const listEl = document.getElementById('ref-list-el')

            // Style of the reference
            // [Icon][List of authors] ([PublicationYear]) [Title]. [publicationTitle/proceedingsTitle], [volume] ([issue]): [pages], [DOI]
            // The list of authors
            // [Last name] [First initials], [Last name] [First initials], ..., [Last name] [First initials]

            const html = `<div id="ref-list-el">${data.map((d, i) =>
                `<p onclick="openNav(${i})"
                    className="reference julich-bar"
                    class="lt-grey-bg ref-item">
                    <span style="font-size: 20px">${d.data.itemType === 'journalArticle'? '📄' : d.data.itemType === 'thesis'? '🎓' : d.data.itemType === 'conferencePaper'? '📝' : d.data.itemType === 'report'? '📈' : '🖥'}</span>
                    ${getCreatorName(d.data.creators)},
                    ${d.data.date ? `(${d.data.date})` : ''}
                    <span class="ref-title">${d.data.title}.</span>

                    ${d.data.publicationTitle? `${d.data.publicationTitle},` : d.data.proceedingsTitle? `${d.data.proceedingsTitle},` : ''}
                    ${d.data.volume? `${d.data.volume} ${d.data.issue? `(${d.data.issue})` : ''} : ` : ''}
                    ${d.data.pages? `${d.data.pages},` : ''}
                    ${d.data.DOI? `<a href="https://doi.org/${d.data.DOI}" target="_blank">${d.data.DOI}</a>` : ''}
                </p><br>`
            ).join('')}</div>`

            document.getElementById('refLoader').remove()
            document.getElementById('reference-list').insertAdjacentHTML('afterbegin', html)
            loadingEl.style.display = 'none'
        })
        .catch(err => console.warn)
}
fetchReferences()

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

const openNav = (i = 0) => {
    removeAttachedHtmls()

    const ref = receivedData[i]
    fetchItemChildren(ref.key)
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
            <div class="ref-detail-row-key">${ref.itemType === 'presentation'? 'Presenter' : 'Author'}${ref.creators.filter(c => c.creatorType && c.creatorType === 'author').length > 1? 's' : ''}</div>
            <div class="ref-detail-row-value">${ref.creators.filter(c => !c.creatorType || c.creatorType === 'author').map((c, i) => (c.firstName + ' ' + c.lastName)).join(', ')}</div>
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

const closeNav = () => {
    removeAttachedHtmls()
    document.getElementById('ref-preview-panel').style.width = '0'
}

const removeAttachedHtmls = () => {
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

const sortChanged = () => {
    const sortValue = document.getElementById('sort-ref').value
    if (sortValue !== sortBy) {
        sortBy = sortValue
        const listEl = document.getElementById('ref-list-el')
        if(listEl) listEl.remove()
        closeNav()
        receivedData = []
        fetchReferences()
    }
}

const search = () => {
    const string = document.getElementById('ref-search').value
    if (searchString !== string) {
        searchString = string
        closeNav()
        receivedData = []
        fetchReferences()
    }
}
