import * as React from 'react'
import { StyleSheet, View, FlatList, SafeAreaView, Platform } from 'react-native'
import { type EmojisByCategory } from '../types'
import { EmojiCategory } from './EmojiCategory'
import { KeyboardContext } from '../contexts/KeyboardContext'
import { Categories } from './Categories'
import { SearchBar } from './SearchBar'
import { useKeyboardStore } from '../store/useKeyboardStore'
import { ConditionalContainer } from './ConditionalContainer'
import { SkinTones } from './SkinTones'

const isAndroid = Platform.OS === 'android'

export const EmojiStaticKeyboard = React.memo(
  () => {
    const {
      activeCategoryIndex,
      setActiveCategoryIndex,
      onCategoryChangeFailed,
      // enableCategoryChangeGesture,
      categoryPosition,
      enableSearchBar,
      customButtons,
      searchPhrase,
      renderList,
      disableSafeArea,
      theme,
      styles: themeStyles,
      shouldAnimateScroll,
      enableCategoryChangeAnimation,
      enableSearchAnimation,
      setShouldAnimateScroll,
      // width,
      setWidth,
    } = React.useContext(KeyboardContext)
    const { keyboardState } = useKeyboardStore()
    const flatListRef = React.useRef<FlatList>(null)
    // const hasMomentumBegan = React.useRef(false)

    const [keyboardScrollOffsetY, setKeyboardScrollOffsetY] = React.useState(0)

    const renderItem = React.useCallback(
      (props) => (
        <EmojiCategory
          setKeyboardScrollOffsetY={setKeyboardScrollOffsetY}
          {...props}
          activeCategoryIndex={activeCategoryIndex}
          disableInnerScroll
          forceRenderAll
        />
      ),
      [activeCategoryIndex],
    )

    const scrollEmojiCategoryListToIndex = React.useCallback(
      (index: number) => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: shouldAnimateScroll && enableCategoryChangeAnimation,
        })
      },
      [enableCategoryChangeAnimation, shouldAnimateScroll],
    )

    React.useEffect(() => {
      setKeyboardScrollOffsetY(0)
    }, [activeCategoryIndex])

    React.useEffect(() => {
      if (searchPhrase && searchPhrase.length >= 1) {
        const idx = renderList.findIndex((c) => c.title === 'search')
        if (idx !== -1) {
          setShouldAnimateScroll(enableSearchAnimation)
          setActiveCategoryIndex(idx)
          scrollEmojiCategoryListToIndex(idx)
          if (idx === 0) {
            // Fallback to top in case scrollToIndex fails due to measurement
            flatListRef.current?.scrollToOffset({ offset: 0, animated: shouldAnimateScroll })
          }
        }
      } else if (!searchPhrase || searchPhrase.length === 0) {
        setShouldAnimateScroll(enableCategoryChangeAnimation)
        setActiveCategoryIndex(0)
        scrollEmojiCategoryListToIndex(0)
        flatListRef.current?.scrollToOffset({ offset: 0, animated: shouldAnimateScroll })
      }
    }, [
      searchPhrase,
      renderList,
      scrollEmojiCategoryListToIndex,
      setActiveCategoryIndex,
      setShouldAnimateScroll,
      enableSearchAnimation,
      enableCategoryChangeAnimation,
      shouldAnimateScroll,
    ])

    const keyExtractor = React.useCallback((item: EmojisByCategory) => item.title, [])
    const viewabilityConfig = React.useRef({ viewAreaCoveragePercentThreshold: 50, minimumViewTime: 120 }).current
    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
      // When searching, don't override the active category set by SearchBar
      if (searchPhrase && searchPhrase.length > 0) return
      if (viewableItems && viewableItems.length > 0) {
        const first = viewableItems[0]
        if (typeof first.index === 'number') setActiveCategoryIndex(first.index)
      }
    }).current

    return (
      <View
        style={[
          styles.container,
          styles.containerShadow,
          categoryPosition === 'top' && disableSafeArea && styles.containerReverse,
          themeStyles.container,
          { backgroundColor: theme.container },
        ]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <ConditionalContainer
          condition={!disableSafeArea}
          container={(children) => (
            <SafeAreaView
              style={[styles.flex, categoryPosition === 'top' && styles.containerReverse]}
            >
              {children}
            </SafeAreaView>
          )}
        >
          <>
            <View
              style={[
                categoryPosition === 'top'
                  ? [styles.searchContainer]
                  : styles.searchContainer,
              ]}
            >
              {enableSearchBar && (
                <SearchBar scrollEmojiCategoryListToIndex={scrollEmojiCategoryListToIndex} />
              )}
              {customButtons}
            </View>
            <FlatList<EmojisByCategory>
              extraData={[keyboardState.recentlyUsed.length, searchPhrase]}
              data={renderList}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              removeClippedSubviews={isAndroid}
              ref={flatListRef}
              onScrollToIndexFailed={onCategoryChangeFailed}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              scrollEnabled
              keyboardDismissMode="on-drag"
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyboardShouldPersistTaps="always"
              style={{ flex: 1 }}
            />
            <View>
              <Categories scrollEmojiCategoryListToIndex={scrollEmojiCategoryListToIndex} />
            </View>
            <SkinTones keyboardScrollOffsetY={keyboardScrollOffsetY} />
          </>
        </ConditionalContainer>
      </View>
    )
  },
  () => true,
)

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    borderRadius: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  containerReverse: { flexDirection: 'column-reverse' },
  containerShadow: {
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    elevation: 10,
  },
})
