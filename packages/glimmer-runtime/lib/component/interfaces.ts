import { EvaluatedArgs } from '../compiled/expressions/args';
import { FunctionExpression } from '../compiled/expressions/function';
import { Layout, CompiledBlock } from '../compiled/blocks';

import Environment, { DynamicScope } from '../environment';
import { ElementOperations } from '../builder';

import { Destroyable, Opaque } from 'glimmer-util';
import { PathReference, RevisionTag } from 'glimmer-reference';

export type Component = Opaque;
export type ComponentClass = any;

export interface ComponentManager<T extends Component> {
  // First, the component manager is asked to create a bucket of state for
  // the supplied arguments. From the perspective of Glimmer, this is
  // an opaque token, but in practice it is probably a component object.
  create(definition: ComponentDefinition<T>, args: EvaluatedArgs, dynamicScope: DynamicScope, hasDefaultBlock: boolean): T;

  // Check if definition is compilable should default it and return a new definition
  ensureCompilable(definition: ComponentDefinition<T>, component: T, env: Environment): ComponentDefinition<T>;

  // Next, Glimmer asks the manager to create a reference for the `self`
  // it should use in the layout.
  getSelf(component: T): PathReference<Opaque>;

  // The `didCreateElement` hook is meant to be used by the host to save
  // off the element. Hosts should use `didCreate`, which runs asynchronously
  // after the rendering process, to provide hooks for user code.
  didCreateElement(component: T, element: Element, operations: ElementOperations);

  // Once the whole top-down rendering process is complete, Glimmer invokes
  // the `didCreate` callbacks.
  didCreate(component: T);

  // Convert the opaque component into a `RevisionTag` that determins when
  // the component's update hooks need to be called, in addition to any
  // outside changes captured in the input arguments. If it returns null,
  // the update hooks will only be called when one or more of the input
  // arguments has changed.
  getTag(component: T): RevisionTag;

  // When the input arguments have changed, and top-down revalidation has
  // begun, the manager's `update` hook is called.
  update(component: T, args: EvaluatedArgs, dynamicScope: DynamicScope);

  // Finally, once top-down revalidation has completed, Glimmer invokes
  // the `didUpdate` callbacks on components that changed.
  didUpdate(component: T);

  // Convert the opaque component into an object that implements Destroyable.
  // If it returns null, the component will not be destroyed.
  getDestructor(component: T): Destroyable;
}

export interface ComponentLayoutBuilder {
  env: Environment;
  tag: ComponentTagBuilder;
  attrs: ComponentAttrsBuilder;

  wrapLayout(layout: Layout);
  fromLayout(layout: Layout);
}

export interface ComponentTagBuilder {
  static(tagName: string);
  dynamic(tagName: FunctionExpression<string>);
}

export interface ComponentAttrsBuilder {
  static(name: string, value: string);
  dynamic(name: string, value: FunctionExpression<string>);
}

export const CACHED_LAYOUT = "CACHED_LAYOUT [d990e194-8529-4f3b-8ee9-11c58a70f7a4]";

export abstract class ComponentDefinition<T> {
  public name: string; // for debugging
  public manager: ComponentManager<T>;
  public ComponentClass: ComponentClass;

  private "CACHED_LAYOUT [d990e194-8529-4f3b-8ee9-11c58a70f7a4]": CompiledBlock = null;

  constructor(name: string, manager: ComponentManager<T>, ComponentClass: ComponentClass) {
    this.name = name;
    this.manager = manager;
    this.ComponentClass = ComponentClass;
  }

  protected abstract compile(builder: ComponentLayoutBuilder);
}
