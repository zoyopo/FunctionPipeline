import fpl from "./FunctionPipeline";

interface Type<T> extends Function {
    new(...args: any[]): T;
}

type NormalObj = { [props: string]: any }
export type TObj = { [props: string]: any, getActionResult?: (res: any) => any }
type SetState = (values: NormalObj) => void

enum KeyMethods {
    getActionResult = "getActionResult",
    init = 'init'
}

export default function createFunctionPipelineByClass<T extends TObj>(cls: Type<T>, setState?: SetState) {
    const instance = new cls()
    const nameSpace = instance.constructor.name
    let methodNames = Reflect.ownKeys(Object.getPrototypeOf(instance))
    methodNames = methodNames.filter(methodName => !['constructor', KeyMethods.init].includes(methodName as string))
    let fplInstance = new fpl()
    // if(!instance['init']){
    //     throw new Error('init method is required')
    // }
    let promiseExecutedImmediately: string[]
    let needReturnValStoredMethods: string[]
    if (instance[KeyMethods.init]) {
        const initResult =instance[KeyMethods.init]()
        promiseExecutedImmediately = initResult.promiseExecutedImmediately
        needReturnValStoredMethods = initResult.needReturnValStoredMethods
    }


    // if(!rootPromiseFnNames){
    //     throw new Error('please config  rootPromiseFnNames  in init method')
    // }
    methodNames.push(KeyMethods.getActionResult)
    instance.getActionResult = (res) => {
        return res
    }
    methodNames.forEach((methodName) => {
        if (promiseExecutedImmediately && promiseExecutedImmediately.includes(methodName as string)) {
            fplInstance = fplInstance.next({type: 'root', promise: instance[methodName as string]})
        } else {
            fplInstance = fplInstance.next((value: any) => {
                const val = instance[methodName as string](value)
                const isMethodNameNeedStore = (needReturnValStoredMethods && needReturnValStoredMethods.includes(methodName as string)) || (methodName === KeyMethods.getActionResult)
                //@ts-ignore
                if (isMethodNameNeedStore && setState) {
                    setState((prev: NormalObj) => ({...prev, [`${nameSpace}/${methodName as string}`]: val}))
                }
                return val
            })
        }
    })
    return fplInstance
}
