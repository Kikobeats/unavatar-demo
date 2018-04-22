/* global fetch */

import React, { Component } from 'react'
import { Image, Flex, Text, Input } from 'rebass'
import styled from 'styled-components'
import 'isomorphic-unfetch'

const CONST = {
  API_ENDPOINT: 'https://unavatar.now.sh',
  AVATAR_PLACEHOLDER: '/static/img/placeholder.png',
  AVATARS_ENDPOINTS: [
    { service: 'Auto', path: '' },
    { service: 'Twitter', path: '/twitter' },
    { service: 'GitHub', path: '/github' },
    { service: 'Instagram', path: '/instagram' },
    { service: 'Facebook', path: '/facebook' }
  ],
  AVATAR_SIZE: '52px',
  DEBOUNCE_MS: 300
}

const getAvatarUrl = url => url || CONST.AVATAR_PLACEHOLDER

const Layout = styled(Flex)`
  margin: 0 auto;
  max-width: 560px;
  padding: 0 1rem;
`

const CustomInput = styled(Input)`
  width: 100px;
  border-radius: 3px;
  border-width: 2px;
  border-style: solid;
  border-color: #ccc;

  &:focus {
    border-color: rgb(0, 103, 238);
    outline: none;
  }
`
const queryAPI = async username => {
  const apiCalls = CONST.AVATARS_ENDPOINTS.map(
    ({ path }) => `${CONST.API_ENDPOINT}${path}/${username}/json`
  )

  const promises = apiCalls.map(url => fetch(url))

  const responses = await Promise.all(promises)
  const payloads = await Promise.all(responses.map(res => res.json()))

  const avatars = payloads.reduce((acc, payload, index) => {
    const service = CONST.AVATARS_ENDPOINTS[index].service
    acc.push({ service, url: getAvatarUrl(payload.url) })
    return acc
  }, [])

  return avatars
}

export default class Home extends Component {
  constructor (props) {
    super(props)
    this.state = { avatars: null, username: null }
    this.onType = this.onType.bind(this)
  }

  static async getInitialProps ({ query }) {
    const { username } = query
    let avatars = []
    if (username) avatars = await queryAPI(username)
    return { avatars, username }
  }

  async onType (event) {
    const username = event.target.value.trim()
    window.history.pushState(`/${username}`, `/${username}`, `/${username}`)

    clearTimeout(this.debounceOnType)
    this.debounceOnType = setTimeout(async () => {
      const avatars = username !== '' ? await queryAPI(username) : []
      this.setState({ avatars, username })
    }, CONST.DEBOUNCE_MS)
  }

  getAvatars () {
    return {
      username: this.state.username || this.props.username,
      avatars: this.state.avatars || this.props.avatars
    }
  }

  render () {
    const { avatars, username } = this.getAvatars()
    const featuredAvatar = (avatars && avatars[0]) || { url: CONST.AVATAR_PLACEHOLDER }

    return (
      <Layout justifyContent='center' alignItems='center' flexDirection='column' is='article'>
        <Flex
          justifyContent='baseline'
          alignItems='center'
          flexDirection='column'
          is='section'
          pt={'92px'}
          pb={'72px'}
        >
          <Flex alignItems='center' justifyContent='center' mb={1}>
            <Flex alignItems='center' justifyContent='center' px={6} pb={3}>
              <Text children={CONST.API_ENDPOINT} mr={1} />
              <CustomInput
                px={2}
                fontSize={2}
                defaultValue={username}
                placeholder='username'
                onChange={this.onType}
              />
            </Flex>
          </Flex>
          <Flex flexDirection='row'>
            <Image style={{ height: '220px' }} src={featuredAvatar.url} />
            <Flex ml={2} flexDirection='column' justifyContent='center' alignItems='center'>
              {avatars.map(
                (avatar, index) =>
                  index !== 0 && (
                    <Image
                      key={avatar.service}
                      style={{ width: CONST.AVATAR_SIZE }}
                      mb={1}
                      src={avatar.url}
                    />
                  )
              )}
            </Flex>
          </Flex>
        </Flex>
        <div>
          {avatars.map(({ url, service }) => (
            <Flex flexDirection='row' mb={4} key={service}>
              <Image style={{ height: CONST.AVATAR_SIZE }} src={url} mr={2} />
              <Flex flexDirection='column' mt={1}>
                <Text
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                  fontWeight='bold'
                  children={service}
                  mb={1}
                />
                <Text
                  is='p'
                  style={{ userSelect: 'all' }}
                  children={
                    service === 'Auto'
                      ? `${CONST.API_ENDPOINT}/${username}`
                      : `${CONST.API_ENDPOINT}/${service.toLowerCase()}/${username}`
                  }
                />
              </Flex>
            </Flex>
          ))}
        </div>
      </Layout>
    )
  }
}
