const zoteroId = '4537513'
const collection = 'VMICJHPV'
let receivedData = []
let sortBy = 'dateDesc'
let searchString = ''
let loading = false

const enableLoading = () => {
    loading = true
    document.getElementById('sort-press').disabled = true
    document.getElementById('press-search').disabled = true
    document.getElementById('search-button').disabled = true
}

const disableLoading = () => {
    loading = true
    document.getElementById('sort-press').disabled = false
    document.getElementById('press-search').disabled = false
    document.getElementById('search-button').disabled = false
}

setTimeout(() => {
    const searchInput = document.getElementById("press-search")
    searchInput.addEventListener('search', evt => search())
    searchInput.addEventListener("keyup", event => {
        if (event.key === 'Enter') {
            search()
        }
    })
})


const fetchPress = ({sort = null, direction= null, queryString = null} = {}) => {
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
        if (!document.getElementById('press-loader')) {
            document.getElementById('loading-panel').insertAdjacentHTML('afterbegin', `<div id="press-loader" class="ref-loader"></div>`)
        }
        enableLoading()
    })

    const listEl = document.getElementById('press-list-el')
    if(listEl) listEl.remove()


    fetch(`https://api.zotero.org/groups/${zoteroId}/collections/${collection}/items/top?format=json&limit=2000
                    &direction=${direction}&sort=${sort}` + (queryString? `&qmode=everything&q=${queryString}` : ''))
        .then(res => res.json())
        .then(data => {

            const getCreatorName = (creators) => {
                return creators
                    .map(c => c.name? c.name :
                        ` ${c.lastName && c.lastName} ${c.firstName && c.firstName
                            .replace(/\./g,'').replace(/-/g, ' ').split(' ').map(n => n[0].toUpperCase()).join(' ')}`)
            }

            disableLoading()
            receivedData = data.map(d => d.data)

            const html = `<div id="press-list-el">${data.map((d, i) =>
                `<div className="reference julich-bar" class="lt-grey-bg ref-item">                    
                    <span class="press-title-head">${d.data.itemType === 'magazineArticle'? 'Magazine Article' 
                        : d.data.itemType === 'webpage'? 'Web Page' 
                        : d.data.itemType === 'blogPost'? 'Blog Post' 
                        : d.data.itemType === 'podcast'? 'Podcast' 
                        : d.data.itemType === 'newspaperArticle'? 'Newspaper Article' 
                        : d.data.itemType === 'interview'? 'Interview' : d.data.itemType}</span> 
                    <span class="press-title-head">${d.data.date ? `<span class="line"></span> ${d.data.date}` : ''}</span> 
                    <span class="press-title-head">${d.data.creators.length ? `<span class="line"></span> ${getCreatorName(d.data.creators)}` : ''}</span> 
                    <span class="press-title-head">${d.data.blogTitle ? `<span class="line"></span> ${d.data.blogTitle}` : ''}</span> 
                    <span class="press-title-head">${d.data.websiteTitle ? `<span class="line"></span> ${d.data.websiteTitle}` : ''}</span> 
                    
                    <br>
                    <a class="press-title underline-hover-animation" href="${d.data.url}" target="_blank">${d.data.title} </a>
                </div><br>`
            ).join('')}</div>`

            document.getElementById('press-loader').remove()
            document.getElementById('press-list').insertAdjacentHTML('afterbegin', html)
            loadingEl.style.display = 'none'
        })
        .catch(err => console.warn)
}
fetchPress()

const sortChanged = () => {
    const sortValue = document.getElementById('sort-press').value
    if (sortValue !== sortBy) {
        sortBy = sortValue
        const listEl = document.getElementById('press-list-el')
        if(listEl) listEl.remove()
        receivedData = []
        fetchPress()
    }
}

const search = () => {
    const string = document.getElementById('press-search').value
    if (searchString !== string) {
        searchString = string
        receivedData = []
        fetchPress()
    }
}
