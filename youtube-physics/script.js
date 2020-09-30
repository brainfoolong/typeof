(async function () {

  /**
   * Get absolute offset to a html element
   * @param {HTMLElement} el
   * @return {{x: number, y: number}}
   */
  function getAbsoluteOffset (el) {
    let pos = { x: 0, y: 0 }
    do {
      pos.x += el.offsetLeft
      pos.y += el.offsetTop
      el = el.offsetParent
    } while (el && el.offsetParent)
    return pos
  }

  /**
   * Wait for script to be loaded
   * @returns {Promise<void>}
   */
  async function wait () {
    return new Promise(function (resolve) {
      if (typeof Matter === 'undefined') {
        let iv = setInterval(function () {
          if (typeof Matter !== 'undefined') {
            clearInterval(iv)
            resolve()
          }
        }, 100)
        return
      }
      resolve()
    })
  }

  /**
   * Add given html element to the simulation world
   * @param {HTMLElement} el
   * @param {string} type Type of body: circle, rect
   */
  function addElementToWorld (el, type) {
    let pos = getAbsoluteOffset(el)
    let body = {}
    if (type === 'rect') {
      body = Matter.Bodies.rectangle(pos.x, pos.y, el.offsetWidth, el.offsetHeight, {
        'attachedElement': el,
        'isStatic': true
      })
    } else if (type === 'circle') {
      body = Matter.Bodies.circle(pos.x, pos.y, el.offsetWidth / 2, {
        'attachedElement': el,
        'isStatic': true
      })
    }

    el.attachedMatterBody = body
    body.initialPosition = { x: body.position.x, y: body.position.y }
    body.restitution = 0.7
    Matter.Body.setAngularVelocity(body, Math.random() * 0.015)
    Matter.Composite.add(worldObjectComposition, body)
  }

  /**
   * Function to add elements to simulation when dom has changed (dynamically loaded content)
   */
  function onDomUpdate () {
    let elements = document.querySelectorAll('ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-station-renderer, ytd-grid-movie-renderer, ytd-game-details-renderer, ytd-grid-channel-renderer, ytd-compact-video-renderer, ytd-comment-renderer')
    for (let i = 0; i < elements.length; i++) {
      let el = elements[i]
      if (addedBodies.indexOf(el) === -1) {
        let type = 'rect'
        addedBodies.push(el)
        intersectionObserver.observe(el)
        addElementToWorld(el, type)
      }
    }
  }

  /**
   * On intersection observer change - We only want to enable elements that are visible on the page
   * @param {IntersectionObserverEntry[]} entries
   */
  function handleIntersect (entries) {
    for (let i = 0; i < entries.length; i++) {
      let entry = entries[i]
      let body = entry.target.attachedMatterBody
      if (entry.isIntersecting && body && body.isStatic) {
        Matter.Body.setStatic(entry.target.attachedMatterBody, false)
        if (!entry.target.style.position) {
          entry.target.style.position = 'relative'
        }
        entry.target.style.zIndex = zIndexCounter++
      }
    }
  }

  /**
   * Update world boundings
   */
  function updateWorldBoundings(){
    Matter.Body.setPosition(boundingBodies.left, {
      x: -50,
      y: 0
    })
    Matter.Body.setPosition(boundingBodies.right, {
      x: window.innerWidth,
      y: 0
    })
    Matter.Body.setPosition(boundingBodies.bottom, {
      x: 0,
      y: document.documentElement.scrollTop + window.innerHeight
    })
  }

  // wait for scripts
  await wait()

  let addedBodies = []
  let zIndexCounter = 10
  let addBodiesTimeout = null
  let scrollTimeout = null
  let runner = null

  let mutationObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      // use timeouts to prevent events bursts (1000+ events per seconds are fired)
      // here we slow down to a max of 1 update per 100ms
      clearTimeout(addBodiesTimeout)
      addBodiesTimeout = setTimeout(onDomUpdate, 100)
    })
  })

  // observe the whole document for any dom change
  mutationObserver.observe(document.body, { attributes: false, childList: true, characterData: false, subtree: true })

  // intersection observer to detect if something is visible on screen
  let intersectionObserver = new IntersectionObserver(handleIntersect, {
    rootMargin: '0px',
    threshold: 0
  })

  // create matter engine and world
  let engine = Matter.Engine.create()

  // create world objects composition
  let worldObjectComposition = Matter.Composite.create()

  // create world bounding bodies to prevent elements from fall out the page
  let boundingBodies = {
    'left': Matter.Bodies.rectangle(-50, 0, 50, window.innerHeight * 100, { isStatic: true }),
    'right': Matter.Bodies.rectangle(window.innerWidth, 0, 50, window.innerHeight * 100, { isStatic: true }),
    'bottom': Matter.Bodies.rectangle(0, window.innerHeight, window.innerWidth * 5, 50, { isStatic: true })
  }

  // add button to page to finally start simulation
  let runButton = document.createElement('div')
  runButton.setAttribute('style', 'border-radius:10px; box-shadow: black 0 0 50px; cursor:pointer; position:fixed; z-index:100; left:calc(50% - 100px); top: calc(50% - 25px); padding:100px; background: #FF2424; color:white; width:200px; font-size:20px; text-align:center; font-weight:bold;')
  runButton.innerText = 'Enable Physics'
  document.getElementsByTagName('body')[0].appendChild(runButton)
  runButton.addEventListener('click', function () {
    runner = Matter.Runner.create()
    Matter.Runner.run(runner, engine)
    runButton.style.display = 'none'
  })

  // add bounding bodies to world objects
  Matter.Composite.add(worldObjectComposition, boundingBodies.left)
  Matter.Composite.add(worldObjectComposition, boundingBodies.right)
  Matter.Composite.add(worldObjectComposition, boundingBodies.bottom)

  // add world objects to world
  Matter.World.add(engine.world, worldObjectComposition)

  // update dom elements positions/translations after a physics update (tick)
  Matter.Events.on(engine, 'afterUpdate', function () {
    for (let i = 0; i < worldObjectComposition.bodies.length; i++) {
      let body = worldObjectComposition.bodies[i]
      let el = body.attachedElement
      if (!el) {
        continue
      }
      let angle = body.angle
      let rotation = angle * (180 / Math.PI)
      let offset = { x: body.position.x - body.initialPosition.x, y: body.position.y - body.initialPosition.y }
      el.style.transform = 'translateX(' + parseInt(offset.x) + 'px) translateY(' + parseInt(offset.y) + 'px) rotate(' + parseInt(rotation) + 'deg)'
    }
  })

  // add scroll event listener to update boundings boxes on scroll
  window.addEventListener('scroll', function () {
    // use timeouts to prevent event bursts
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(function () {
      updateWorldBoundings()
    }, 50)
  })

  // update world boundings
  updateWorldBoundings()
})()