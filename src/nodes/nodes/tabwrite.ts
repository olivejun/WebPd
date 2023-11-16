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

import { NodeImplementation } from '@webpd/compiler/src/compile/types'
import { NodeBuilder } from '../../compile-dsp-graph/types'
import { coldFloatInletWithSetter } from '../standard-message-receivers'
import { declareTabBase, messageSetArrayCode, prepareIndexCode, stateVariablesTabBase, translateArgsTabBase } from './tab-base'
import { stdlib } from '@webpd/compiler'
import { AnonFunc, Func, Var, ast } from '@webpd/compiler/src/ast/declare'

interface NodeArguments { arrayName: string }
const stateVariables = {
    ...stateVariablesTabBase,
    index: 1,
    funcSetIndex: 1,
}
type _NodeImplementation = NodeImplementation<NodeArguments, typeof stateVariables>

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: translateArgsTabBase,
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
            '1': { type: 'message', id: '1' },
        },
        outlets: {},
    }),
}

// ------------------------------ generateDeclarations ------------------------------ //
const generateDeclarations: _NodeImplementation['generateDeclarations'] = (context) => {
    const { state } = context
    return ast`
        ${Var('Int', state.index, 0)}
        ${declareTabBase(context)}

        ${Func(state.funcSetIndex, [
            Var('Float', 'index')
        ], 'void')`
            ${state.index} = ${prepareIndexCode('index', context)}
        `}
    `
}

// ------------------------------- generateMessageReceivers ------------------------------ //
const generateMessageReceivers: _NodeImplementation['generateMessageReceivers'] = (context) => {
    const { state } = context
    return {
        '0': AnonFunc([Var('Message', 'm')], 'void')`
            if (msg_isMatching(m, [MSG_FLOAT_TOKEN])) {        
                if (${state.array}.length === 0) {
                    return

                } else {
                    ${state.array}[${state.index}] = msg_readFloatToken(m, 0)
                    return
                }
                return 

            } ${messageSetArrayCode(context)}
        `,

        '1': coldFloatInletWithSetter(state.funcSetIndex)
    }
}

// ------------------------------------------------------------------- //
const nodeImplementation: _NodeImplementation = {
    generateDeclarations,
    generateMessageReceivers,
    stateVariables,
    dependencies: [stdlib.commonsWaitEngineConfigure, stdlib.commonsArrays]
}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}