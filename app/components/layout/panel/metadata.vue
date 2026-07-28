<script lang="ts" setup>
const { currentTrack } = usePlayback()
const { selectedTrackData } = useTrackSelection()

const { commitChanges, isCommittingChanges, isDirty, revertAllChanges } = useProvideMetadata(
  () => selectedTrackData.value.entries,
)

const id3Tag = computed(() => currentTrack.value?.primary_tag ?? ID3_DEFAULT_TAG)
const { openElementWindow } = useLayout()

const form = useTemplateRef<HTMLFormElement>('form')
const { focused: isFormFocused } = useFocusWithin(form)
onKeyStrokeSafe(
  ['meta_s', 'meta_enter'],
  () => {
    if (isDirty.value && isFormFocused.value) commitChanges()
  },
  { activeElement: form },
)

onKeyStrokeSafe(
  'meta_r',
  () => {
    if (isDirty.value && isFormFocused.value) revertAllChanges()
  },
  { activeElement: form },
)
</script>

<template>
  <LayoutPanelLayout class="p-0 gap-0 size-full overflow-y-auto *:shrink-0">
    <UContextMenu>
      <UContextMenuTrigger as-child>
        <div class="pl-1 pr-2 border-b flex gap-1 w-full items-center">
          <div class="m-1 flex gap-1 items-center">
            <UButton
              :disabled="!isDirty"
              :is-loading="isCommittingChanges"
              variant="ghost"
              size="icon"
              class="shrink-0 size-6"
              :class="{
                'text-emerald-500 hover:text-emerald-500 active:text-emerald-500': isDirty,
              }"
              title="Save changes to file"
              @click="commitChanges()"
            >
              <Icon name="tabler:check" />
            </UButton>
            <UButton
              :disabled="!isDirty || isCommittingChanges"
              variant="ghost"
              size="icon"
              class="shrink-0 size-6"
              :class="{
                'text-danger hover:text-danger active:text-danger': isDirty,
              }"
              title="Save changes to file"
              @click="revertAllChanges()"
            >
              <Icon name="tabler:arrow-back-up" />
            </UButton>
          </div>
          <p
            class="text-xs text-muted-foreground font-medium flex-1 w-full truncate"
            :title="currentTrack?.filename"
          >
            {{ currentTrack?.filename }}
          </p>
          <USelectRoot>
            <USelectTrigger
              title="ID3 tag"
              variant="ghost"
              size="sm"
              :with-icon="false"
            >
              <USelectValue>
                {{ formatId3Tag(id3Tag) }}
              </USelectValue>
            </USelectTrigger>
            <USelectContent :side-offset="3">
              <USelectItem
                v-for="tag in ID3_TAG_TYPES"
                :key="tag"
                :value="tag"
              >
                <USelectItemText>
                  {{ formatId3Tag(tag) }}
                </USelectItemText>
              </USelectItem>
            </USelectContent>
          </USelectRoot>
        </div>
      </UContextMenuTrigger>
      <UContextMenuContent>
        <UContextMenuItem @click="openElementWindow('metadataView')">
          Set displayed frames...
        </UContextMenuItem>
      </UContextMenuContent>
    </UContextMenu>

    <form class="p-4 flex flex-col gap-2">
      <LayoutPanelMetadataField
        v-for="frame in $settings.layout.element.metadataView.frames"
        :key="frame"
        :id3-frame="frame"
        :track="currentTrack"
      />
    </form>
  </LayoutPanelLayout>
</template>
