/*
 * Copyright (c) 2022-2023 Sébastien Piquemal <sebpiq@protonmail.com>, Chris McCormick.
 *
 * This file is part of WebPd
 * (see https://github.com/sebpiq/WebPd).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as nodeImplementationsTestHelpers from '@webpd/compiler/src/test-helpers-node-implementations'
import { nodeImplementation, builder } from './msg'
import { buildNode, NODE_IMPLEMENTATION_TEST_PARAMETERS, testNodeTranslateArgs } from '../test-helpers'

describe('msg', () => {

    describe('builder', () => {
        describe('translateArgs', () => {
            it('should handle args as expected', () => {
                testNodeTranslateArgs(builder, ['a', 12, 'hello $1'], {
                    templates: [['a', 12, 'hello $1']],
                })
                testNodeTranslateArgs(builder, ['a', 12, ',', 'hello $1'], {
                    templates: [['a', 12], ['hello $1']],
                })
                testNodeTranslateArgs(builder, [',', 1, ',', 2], {
                    templates: [[1], [2]],
                })
            })

            it('should interpret and trim "symbol" prefix', () => {
                testNodeTranslateArgs(builder, ['symbol'], {
                    templates: [['']],
                })
                testNodeTranslateArgs(builder, ['symbol', 'bla'], {
                    templates: [['bla']],
                })
                testNodeTranslateArgs(builder, ['symbol', 123], {
                    templates: [['']],
                })
                testNodeTranslateArgs(builder, ['symbol', 'poi', 'iop'], {
                    templates: [['poi']],
                })
            })
        })
    })

    describe('implementation', () => {
        it.each(NODE_IMPLEMENTATION_TEST_PARAMETERS)(
            'should transfer directly messages without dollar strings %s',
            async ({ target, bitDepth }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        bitDepth,
                        node: buildNode(builder, 'msg', {
                            templates: [[123, 'hello']],
                        }),
                        nodeImplementation,
                    },
                    [
                        {
                            ins: {
                                '0': [['bang'], ['blabla'], ['quoi?', 456]],
                            },
                        },
                        {
                            outs: {
                                '0': [
                                    [123, 'hello'],
                                    [123, 'hello'],
                                    [123, 'hello'],
                                ],
                            },
                        },
                    ]
                )
            }
        )

        it.each(NODE_IMPLEMENTATION_TEST_PARAMETERS)(
            'should substitute entire dollar strings %s',
            async ({ target, bitDepth }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        bitDepth,
                        node: buildNode(builder, 'msg', {
                            templates: [[123, '$2', '$1']],
                        }),
                        nodeImplementation,
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    ['wow', 'hehe', 'hoho'],
                                    ['blabla', 456],
                                ],
                            },
                        },
                        {
                            outs: {
                                '0': [
                                    [123, 'hehe', 'wow'],
                                    [123, 456, 'blabla'],
                                ],
                            },
                        },
                    ]
                )
            }
        )

        it.each(NODE_IMPLEMENTATION_TEST_PARAMETERS)(
            'should substitute dollar strings within strings %s',
            async ({ target, bitDepth }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        bitDepth,
                        node: buildNode(builder, 'msg', {
                            templates: [['hello_$2', '$1', 'greetings']],
                        }),
                        nodeImplementation,
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    ['earth', 'saturn'],
                                    ['satan', 666],
                                ],
                            },
                        },
                        {
                            outs: {
                                '0': [
                                    ['hello_saturn', 'earth', 'greetings'],
                                    ['hello_666', 'satan', 'greetings'],
                                ],
                            },
                        },
                    ]
                )
            }
        )

        it.each(NODE_IMPLEMENTATION_TEST_PARAMETERS)(
            'should sequentially send all messages in templates %s',
            async ({ target, bitDepth }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        bitDepth,
                        node: buildNode(builder, 'msg', {
                            templates: [[123, '$1'], ['bla-$1']],
                        }),
                        nodeImplementation,
                    },
                    [
                        {
                            ins: {
                                '0': [['hello'], ['salut']],
                            },
                        },
                        {
                            outs: {
                                '0': [
                                    [123, 'hello'],
                                    ['bla-hello'],
                                    [123, 'salut'],
                                    ['bla-salut'],
                                ],
                            },
                        },
                    ]
                )
            }
        )

        it.each(NODE_IMPLEMENTATION_TEST_PARAMETERS)(
            'should set new message when using "set" %s',
            async ({ target, bitDepth }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        bitDepth,
                        node: buildNode(builder, 'msg', {
                            templates: [[123, '$1'], ['bla-$1']],
                        }),
                        nodeImplementation,
                    },
                    [
                        {
                            ins: {
                                '0': [['set', 'salut', 123]],
                            },
                        },
                        {
                            outs: {
                                '0': [],
                            },
                        },
                    ],
                    [
                        {
                            ins: {
                                '0': [['hello']],
                            },
                        },
                        {
                            outs: {
                                '0': [['salut', 123]],
                            },
                        },
                    ],
                )
            }
        )
    })
})
